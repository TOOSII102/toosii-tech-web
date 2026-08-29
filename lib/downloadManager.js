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

export { isIosDevice }

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
 *
 * Saving to disk is handled entirely in here — the caller just gets onStateChange
 * called with 'complete' once the file has actually been written to the device (or
 * 'error' if that failed, e.g. a stalled registration or a lost cache entry), so
 * every page that uses this gets the fix for free.
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

  let settled = false
  let stallTimer = null
  let pendingBlob = null
  let pendingFilename = filename

  const cleanup = () => {
    bgFetch.removeEventListener('progress', onProgressEvent)
    navigator.serviceWorker.removeEventListener('message', onMessage)
    if (stallTimer) clearTimeout(stallTimer)
  }

  const finishSuccess = async () => {
    if (settled) return
    settled = true
    cleanup()
    // The service worker's backgroundfetchsuccess handler finishes writing the file
    // into cache slightly after the registration itself reports 'success' — retry
    // the claim a few times instead of failing on that race.
    let claimed = null
    for (let attempt = 0; attempt < 6 && !claimed; attempt += 1) {
      claimed = await claimBackgroundDownload(id)
      if (!claimed) await new Promise(resolve => setTimeout(resolve, 400))
    }
    if (claimed?.blob) {
      // Deliberately NOT auto-saving here. This callback runs from a 'progress' event
      // or a postMessage handler — there is no live user gesture backing it, and
      // browsers can (and increasingly do) silently drop a programmatic file save that
      // isn't tied to a real tap, even though no error is thrown. Hand the blob back
      // and let the UI show a real "Save to device" button so the actual write happens
      // inside a genuine click handler instead.
      pendingBlob = claimed.blob
      pendingFilename = claimed.filename || filename
      onStateChange?.('ready', { filename: pendingFilename })
    } else {
      onStateChange?.('error')
    }
  }

  const finishFailure = () => {
    if (settled) return
    settled = true
    cleanup()
    forgetBackgroundDownload(id)
    onStateChange?.('error')
  }

  function onMessage(event) {
    if (event.data?.type === 'bg-download-ready' && event.data.id === id) finishSuccess()
  }
  function onProgressEvent() {
    onProgress?.({ loaded: bgFetch.downloaded, total: bgFetch.downloadTotal })
    if (stallTimer) { clearTimeout(stallTimer); stallTimer = null }
    if (bgFetch.result === 'success') finishSuccess()
    else if (bgFetch.result === 'failure') finishFailure()
  }

  bgFetch.addEventListener('progress', onProgressEvent)
  navigator.serviceWorker.addEventListener('message', onMessage)

  // Some in-app browsers / WebViews accept a Background Fetch registration but never
  // actually progress it (stuck at "Connecting…", 0 bytes, no result). If nothing
  // happens for 12s, treat it as failed so the caller can fall back to a direct
  // download instead of leaving the user staring at a stuck progress bar.
  stallTimer = setTimeout(() => {
    if (!settled && bgFetch.downloaded === 0 && !bgFetch.result) finishFailure()
  }, 12000)

  return {
    id,
    cancel: () => { settled = true; cleanup(); bgFetch.abort(); forgetBackgroundDownload(id) },
    registration: bgFetch,
    // Call this from inside a real click handler once onStateChange fires 'ready' —
    // that live user gesture is what makes the browser actually commit the file.
    saveNow: async () => {
      if (!pendingBlob) return { ok: false }
      const result = await saveBlobToDevice(pendingBlob, pendingFilename)
      pendingBlob = null
      return result
    },
  }
}

/**
 * Call once when a page mounts to find any background downloads that finished while
 * no tab was open to receive the postMessage, and whose completion notification was
 * dismissed or never tapped. Returns the claimed files WITHOUT saving them — like
 * createBackgroundDownload, this runs outside any user gesture, so the caller must
 * show a "Save to device" button and call saveBlobToDevice from inside its onClick.
 */
export async function claimAllPendingBackgroundDownloads() {
  if (typeof window === 'undefined' || !supportsBackgroundFetch()) return []
  const manifest = readManifest()
  const found = []
  for (const id of Object.keys(manifest)) {
    try {
      const result = await claimBackgroundDownload(id)
      if (result?.blob) found.push({ id, blob: result.blob, filename: result.filename })
    } catch {}
  }
  return found
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

function isIosDevice() {
  if (typeof navigator === 'undefined') return false
  // iPadOS 13+ reports as "Macintosh" but exposes touch support, unlike a real Mac.
  return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/**
 * Restrictive in-app browsers (WhatsApp, Instagram, TikTok, etc.) run on a stripped-down
 * WebView that often can't write to the real Downloads folder even though the JS APIs
 * appear to work. There's no code fix for that sandbox — the honest thing to do is
 * detect it and tell the caller, so the UI can suggest opening in the full browser.
 */
export function isRestrictiveWebView() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/FBAN|FBAV|Instagram|Line\/|MicroMessenger|TikTok|Twitter|WhatsApp/i.test(ua)) return true
  // Android WebView signature: has "Version/" (a WebKit/Chrome hybrid marker) alongside
  // "wv" in the UA, as opposed to a real Chrome install.
  if (/Android/.test(ua) && /; ?wv\)/.test(ua)) return true
  return false
}

/**
 * Saves a blob to the device using whichever technique the current browser actually
 * honors as a real save rather than just opening a viewer:
 *
 *  - iOS Safari/WebView: blob anchor-downloads are unreliable there (often just opens
 *    the file instead of saving it, and iOS has no browser "Downloads" list anyway) —
 *    so this uses the Web Share sheet with the real File when available, which lets the
 *    person tap "Save to Files" and puts it in the Files app for real.
 *  - Everywhere else (desktop Chrome/Firefox/Edge/Safari, Android Chrome/Firefox/Samsung
 *    Internet): a blob anchor with the `download` attribute is what those browsers
 *    recognize as a genuine download — it lands in chrome://downloads / the downloads
 *    shelf / the Downloads folder immediately, no extra tap required.
 *
 * Returns a small status object so the caller can adjust its "saved!" message if needed.
 */
export async function saveBlobToDevice(blob, filename) {
  const safeName = (filename || 'download').replace(/[\\/:*?"<>|]/g, '_')

  if (isIosDevice() && typeof navigator !== 'undefined' && navigator.canShare) {
    try {
      const file = new File([blob], safeName, { type: blob.type || 'application/octet-stream' })
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: safeName })
        return { ok: true, method: 'share' }
      }
    } catch (error) {
      if (error?.name === 'AbortError') return { ok: false, method: 'share', canceled: true }
      // fall through to the anchor technique below
    }
  }

  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = safeName
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500)
  return { ok: true, method: isIosDevice() ? 'anchor-ios-fallback' : 'anchor' }
}
