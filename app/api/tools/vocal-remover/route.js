import { NextResponse } from 'next/server'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { extname, join } from 'node:path'
import { existsSync } from 'node:fs'
import ffmpegPath from 'ffmpeg-static'

const execFileAsync = promisify(execFile)
const EP = 'https://eliteprotech-apis.zone.id'
const MAX_BYTES = 4 * 1024 * 1024
const SOURCE_TIMEOUT_MS = 20000
const FFMPEG_TIMEOUT_MS = 40000
const UPLOAD_TIMEOUT_MS = 15000

export const runtime = 'nodejs'
export const maxDuration = 60

function jsonError(message, status = 500, details) {
  return NextResponse.json({
    error: message,
    provider: 'Toosii Tech',
    ...(details ? { details } : {}),
  }, { status })
}

function safeFilename(name = 'audio.mp3') {
  const cleaned = String(name).replace(/[^a-z0-9._-]/gi, '_')
  return cleaned || 'audio.mp3'
}

async function uploadToHost(buf, filename, mimeType = 'audio/mpeg') {
  const blob = new Blob([buf], { type: mimeType })
  const name = safeFilename(filename)

  try {
    const form = new FormData()
    form.append('reqtype', 'fileupload')
    form.append('fileToUpload', blob, name)
    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    })
    const text = (await res.text()).trim()
    if (res.ok && text.startsWith('http')) return text
  } catch (e) {
    console.warn('[vocal-remover] catbox upload failed:', e.message)
  }

  try {
    const form = new FormData()
    form.append('file', blob, name)
    const res = await fetch('https://0x0.st', {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    })
    const text = (await res.text()).trim()
    if (res.ok && text.startsWith('http')) return text
  } catch (e) {
    console.warn('[vocal-remover] 0x0 upload failed:', e.message)
  }

  try {
    const form = new FormData()
    form.append('file', blob, name)
    const res = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    })
    const json = await res.json()
    const url = json?.data?.url?.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
    if (res.ok && url?.startsWith('http')) return url
  } catch (e) {
    console.warn('[vocal-remover] tmpfiles upload failed:', e.message)
  }

  return null
}

async function fetchAudioSource(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ToosiiTech/1.0)',
      Accept: 'audio/*,application/octet-stream;q=0.9,*/*;q=0.5',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
  })

  if (!res.ok) throw new Error(`Audio source returned HTTP ${res.status}`)
  const contentLength = Number(res.headers.get('content-length') || 0)
  if (contentLength > MAX_BYTES) throw new Error('The audio source is larger than the 4 MB limit.')

  const buffer = Buffer.from(await res.arrayBuffer())
  if (!buffer.length) throw new Error('The audio source is empty.')
  if (buffer.length > MAX_BYTES) throw new Error('The audio source is larger than the 4 MB limit.')

  return {
    buffer,
    contentType: res.headers.get('content-type') || 'audio/mpeg',
  }
}

function resolveFfmpegPath() {
  const candidates = [
    ffmpegPath,
    join(process.cwd(), 'node_modules/ffmpeg-static/ffmpeg'),
    join(process.cwd(), '.next/server/app/api/tools/vocal-remover/ffmpeg'),
  ].filter(Boolean)

  return candidates.find(candidate => existsSync(candidate)) || null
}

async function separateLocally(inputBuffer, inputName = 'audio.mp3', requestedTrack = null) {
  const binaryPath = resolveFfmpegPath()
  if (!binaryPath) throw new Error('The local audio processor is unavailable.')

  const workDir = await mkdtemp(join(tmpdir(), 'toosii-vocal-'))
  const extension = extname(inputName).toLowerCase() || '.audio'
  const inputPath = join(workDir, `input${extension}`)
  const instrumentalPath = join(workDir, 'instrumental.mp3')
  const vocalPath = join(workDir, 'vocals.mp3')

  // This is a deterministic fallback that works without credentials: the
  // centre channel is isolated as vocals and the stereo side signal becomes
  // a karaoke-style instrumental. It is intentionally labeled as a fallback.
  const instrumentalFilter = 'pan=stereo|c0=0.5*c0-0.5*c1|c1=0.5*c1-0.5*c0'
  const vocalFilter = 'pan=stereo|c0=0.5*c0+0.5*c1|c1=0.5*c0+0.5*c1'
  const commonArgs = [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', inputPath,
    '-vn', '-map_metadata', '-1', '-ac', '2', '-ar', '44100',
    '-codec:a', 'libmp3lame', '-b:a', '128k',
  ]

  try {
    await writeFile(inputPath, inputBuffer)
    const jobs = []
    if (!requestedTrack || requestedTrack === 'instrumental') {
      jobs.push(execFileAsync(binaryPath, [...commonArgs, '-af', instrumentalFilter, instrumentalPath], { timeout: FFMPEG_TIMEOUT_MS }))
    }
    if (!requestedTrack || requestedTrack === 'vocal') {
      jobs.push(execFileAsync(binaryPath, [...commonArgs, '-af', vocalFilter, vocalPath], { timeout: FFMPEG_TIMEOUT_MS }))
    }
    await Promise.all(jobs)

    const instrumental = requestedTrack === 'vocal' ? null : await readFile(instrumentalPath)
    const vocal = requestedTrack === 'instrumental' ? null : await readFile(vocalPath)
    return { instrumental, vocal, method: 'Toosii local stereo separation' }
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {})
  }
}

async function separateWithProvider(audioUrl) {
  const response = await fetch(`${EP}/vocalremove?url=${encodeURIComponent(audioUrl)}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ToosiiTech/1.0)' },
    signal: AbortSignal.timeout(12000),
  })

  if (!response.ok) throw new Error(`Fallback service returned HTTP ${response.status}`)
  const payload = await response.json()
  const instrumental = payload.instrumental || payload.result || payload.url || payload.download
  if (!instrumental) throw new Error('Fallback service did not return an instrumental track.')
  return { instrumental, vocal: payload.vocal || null, method: 'Toosii upstream separation fallback' }
}

function audioResponse(buffer, filename) {
  const safeName = safeFilename(filename)
  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(buffer.length),
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

async function providerTrackResponse(url, filename) {
  if (!url) throw new Error('The requested track was not returned by the fallback service.')
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ToosiiTech/1.0)' },
    signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`The generated track returned HTTP ${response.status}.`)
  return audioResponse(Buffer.from(await response.arrayBuffer()), filename)
}

export async function POST(req) {
  const requestedTrack = new URL(req.url).searchParams.get('track')
  const track = requestedTrack === 'vocal' || requestedTrack === 'instrumental' ? requestedTrack : null
  let sourceUrl = null
  let sourceBuffer = null
  let sourceName = 'audio.mp3'

  try {
    const contentType = req.headers.get('content-type') || ''

    if (!track) {
      if (contentType.includes('application/json')) {
        const body = await req.json()
        sourceUrl = body?.url?.trim()
        if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) {
          return jsonError('Please enter a valid audio URL starting with https://.', 400)
        }
        return NextResponse.json({
          ready: true,
          tracks: { instrumental: true, vocal: true },
          original: sourceUrl,
          method: 'Toosii local stereo separation',
          provider: 'Toosii Tech',
        })
      }
      if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData()
        const file = formData.get('file')
        if (!file || typeof file.arrayBuffer !== 'function') {
          return jsonError('No file received. Please select an audio file and try again.', 400)
        }
        const size = Number(file.size || 0)
        if (size < 1000) return jsonError('The selected file is empty or corrupted.', 400)
        if (size > MAX_BYTES) return jsonError('File is larger than the 4 MB upload limit. Use a smaller file or paste a public direct audio URL.', 413)
        return NextResponse.json({
          ready: true,
          tracks: { instrumental: true, vocal: true },
          original: null,
          method: 'Toosii local stereo separation',
          provider: 'Toosii Tech',
        })
      }
      return jsonError('Unsupported request format. Use an audio file upload or a JSON audio URL.', 400)
    }

    if (contentType.includes('application/json')) {
      const body = await req.json()
      sourceUrl = body?.url?.trim()
      if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) {
        return jsonError('Please enter a valid audio URL starting with https://.', 400)
      }
      sourceName = safeFilename(sourceUrl.split('/').pop()?.split('?')[0] || sourceName)
      const source = await fetchAudioSource(sourceUrl)
      sourceBuffer = source.buffer
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file')
      if (!file || typeof file.arrayBuffer !== 'function') {
        return jsonError('No file received. Please select an audio file and try again.', 400)
      }

      sourceName = safeFilename(file.name || sourceName)
      sourceBuffer = Buffer.from(await file.arrayBuffer())
      if (sourceBuffer.length < 1000) return jsonError('The selected file is empty or corrupted.', 400)
      if (sourceBuffer.length > MAX_BYTES) {
        return jsonError('File is larger than the 4 MB upload limit. Use a smaller file or paste a public direct audio URL.', 413)
      }
    } else {
      return jsonError('Unsupported request format. Use an audio file upload or a JSON audio URL.', 400)
    }

    const stem = sourceName.replace(/\.[^.]+$/, '') || 'audio'
    let separated

    try {
      separated = await separateLocally(sourceBuffer, sourceName, track)
    } catch (localError) {
      console.warn('[vocal-remover] local separation failed:', localError.message)
      if (!sourceUrl) {
        sourceUrl = await uploadToHost(sourceBuffer, sourceName)
      }
      if (!sourceUrl) throw new Error('The local processor failed and the source could not be uploaded for fallback processing.')
      separated = await separateWithProvider(sourceUrl)
    }

    if (track) {
      if (typeof separated[track] === 'string') {
        return providerTrackResponse(separated[track], `${stem}_${track}.mp3`)
      }
      if (!separated[track]) throw new Error(`The ${track} track was not returned.`)
      return audioResponse(separated[track], `${stem}_${track}.mp3`)
    }

    return NextResponse.json({
      ready: true,
      tracks: { instrumental: true, vocal: Boolean(separated.vocal) },
      original: sourceUrl,
      method: separated.method,
      provider: 'Toosii Tech',
    })
  } catch (error) {
    console.error('[vocal-remover]', error)
    const message = error?.name === 'TimeoutError' || error?.message?.toLowerCase().includes('timeout')
      ? 'Processing timed out. Try a shorter audio clip or a smaller file.'
      : error?.message || 'Vocal removal failed. Please try another audio file.'
    return jsonError(message, 502)
  }
}
