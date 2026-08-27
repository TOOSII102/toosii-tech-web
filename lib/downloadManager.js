'use client'

// Shared engine used by the movies (and any other) DownloadButton to give downloads
// real pause/resume control, and — on browsers that support it — a true background
// download that keeps going after the tab or app is closed.
//
// Two engines are exposed:
//
//  1. createStreamDownload  — works everywhere. Streams the response with fetch(),
//     keeps every chunk in memory, and supports pause() (stop reading, keep bytes)
//     and resume() (re-request the remainder with a Range header and keep appending).
//     Runs as long as the tab stays open, including while it's in a background tab.
//
//  2. createBackgroundDownload — Chromium-only Background Fetch API. Hands the
//     transfer to the browser/OS itself, so it survives full tab/app closure and shows
//     a native progress + completion notification. Trade-off: the platform discards
//     bytes on abort, so this engine only supports cancel, not pause/resume.
//
// The DownloadButton in app/tools/movies/page.js picks whichever engine fits and
// falls back automatically when Background Fetch isn't available.

const BG_ICON = { src: '/logo.png', sizes: '512x512', type: 'image/png' }
const BG_MANIFEST_KEY = 'toosii-bg-downloads-v1'

export function supportsBackgroundFetch() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'BackgroundFetchManager' in window
}

function hashId(url) {
  let hash = 0
  const s = String(url)
  for (let i = 0; i < s.length; i += 1) hash = (hash * 31 + s.charCodeAt(i)) | 0
  return Math.abs(hash).toString(36)
}

function readManifest() {
  try { return JSON.parse(window.localStorage.getItem(BG_MANIFEST_KEY) || '{}') } catch { return {} }
}
function writeManifest(manifest) {
  try { window.localStorage.setItem(BG_MANIFEST_KEY, JSON.stringify(manifest)) } catch {}
}
export function rememberBackgroundDownload(id, meta) {
  const manifest = readManifest()
  manifest[id] = { ...meta, savedAt: Date.now() }
  writeManifest(manifest)
}
export function forgetBackgroundDownload(id) {
  const manifest = readManifest()
  delete manifest[id]
  writeManifest(manifest)
}
export function getRememberedBackgroundDownload(id) {
  return readManifest()[id] || null
}

/**
 * Fully manual, resumable, pausable downloader. No special browser API required.
 */
export function createStreamDownload({ url, headers = {}, onProgress, onStateChange }) {
  const chunks = []
  let loaded = 0
  let total = 0
  let contentType = ''
  let controller = null
  let canceled = false
  let state = 'idle' // idle | connecting | downloading | paused | complete | error | canceled
  let speedAt = 0
  let speedBytes = 0
  let speed = 0

  const setState = next => { state = next; onStateChange?.(next) }

  async function pump() {
    controller = new AbortController()
    setState(loaded ? 'downloading' : 'connecting')
    try {
      const response = await fetch(url, {
        headers: { ...headers, Range: `bytes=${loaded}-` },
        cache: 'no-store',
        signal: controller.signal,
      })
      if (!response.ok && response.status !== 206 && response.status !== 200) {
        throw new Error(`Download source unavailable (${response.status})`)
      }
      if (!contentType) contentType = response.headers.get('content-type') || ''
      if (!total) {
        const contentLength = Number(response.headers.get('content-length'))
        const rangeMatch = String(response.headers.get('content-range') || '').match(/\/(\d+)$/)
        total = rangeMatch ? Number(rangeMatch[1]) : (Number.isFinite(contentLength) && contentLength > 0 ? contentLength + loaded : 0)
      }
      if (!response.body) throw new TypeError('Streaming is unavailable in this browser')
      const reader = response.body.getReader()
      setState('downloading')
      speedAt = performance.now()
      speedBytes = loaded
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (!value) continue
        chunks.push(value)
        loaded += value.byteLength
        const now = performance.now()
        const elapsed = (now - speedAt) / 1000
        if (elapsed >= 0.25) {
          const instant = (loaded - speedBytes) / Math.max(elapsed, 0.001)
          speed = speed ? speed * 0.7 + instant * 0.3 : instant
          speedAt = now
          speedBytes = loaded
          onProgress?.({ loaded, total, speed })
        }
      }
      if (canceled) return
      onProgress?.({ loaded, total, speed: 0 })
      setState('complete')
    } catch (error) {
      if (controller?.signal.aborted) return // deliberate pause/cancel, not a real error
      setState('error')
      throw error
    }
  }

  return {
    start: () => pump(),
    pause() {
      if (state === 'downloading' || state === 'connecting') { controller?.abort(); setState('paused') }
    },
    resume() {
      if (state === 'paused' || state === 'error') return pump()
      return Promise.resolve()
    },
    cancel() { canceled = true; controller?.abort(); setState('canceled') },
    getBlob: () => new Blob(chunks, { type: contentType || 'video/mp4' }),
    get state() { return state },
    get loaded() { return loaded },
    get total() { return total },
  }
}

/**
 * True background download via the Background Fetch API. Only call this after
 * checking supportsBackgroundFetch(). Progress keeps reporting while the tab is
 * open; if the tab/app is closed the browser finishes the transfer on its own and
 * the service worker (see public/sw.js) shows a notification when it's done.
 */
export async function createBackgroundDownload({ url, filename, title, size, onProgress, onStateChange }) {
  if (!supportsBackgroundFetch()) throw new Error('Background downloads are not supported in this browser')
  const registration = await navigator.serviceWorker.ready
  const id = `dl-${hashId(url)}-${Date.now().toString(36)}`
  rememberBackgroundDownload(id, { url, filename, title })
  const bgFetch = await registration.backgroundFetch.fetch(id, [url], {
    title: title || filename || 'Downloading video',
    icons: [BG_ICON],
    downloadTotal: Number(size) || 0,
  })
  onStateChange?.('downloading')
  bgFetch.addEventListener('progress', () => {
    onProgress?.({ loaded: bgFetch.downloaded, total: bgFetch.downloadTotal })
    if (bgFetch.result === 'success') onStateChange?.('complete')
    else if (bgFetch.result === 'failure') onStateChange?.('error')
  })
  return {
    id,
    cancel: () => { bgFetch.abort(); forgetBackgroundDownload(id) },
    registration: bgFetch,
  }
}

/**
 * After the service worker finishes a background fetch it caches the response under
 * this name (see backgroundfetchsuccess in public/sw.js). Call this — typically after
 * the page reopens from the completion notification — to pull the finished file out of
 * that cache and hand it to the browser's normal "save to device" flow.
 */
export async function claimBackgroundDownload(id) {
  if (typeof window === 'undefined' || !('caches' in window)) return null
  const meta = getRememberedBackgroundDownload(id)
  if (!meta) return null
  const cache = await caches.open('toosii-bg-downloads')
  const match = await cache.match(meta.url)
  if (!match) return null
  const blob = await match.blob()
  await cache.delete(meta.url)
  forgetBackgroundDownload(id)
  return { blob, filename: meta.filename, title: meta.title }
}

export function saveBlobToDevice(blob, filename) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename || 'download.mp4'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}
