export const maxDuration = 120

import { NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import { readFile, writeFile, unlink } from 'fs/promises'
import path from 'path'
import os from 'os'
import ffmpegPath from 'ffmpeg-static'
import { ytdlpJson, ytdlpGetUrl, findPython3, getYtdlpPath } from '../../../../lib/ytdlp'

const execFileAsync = promisify(execFile)
const YOUTUBE_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'
const YOUTUBE_CLIENT_VERSION = '1.65.10'
const YOUTUBE_USER_AGENT = 'com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip'
const YOUTUBE_PLAYER_URL = `https://www.youtube.com/youtubei/v1/player?key=${YOUTUBE_API_KEY}&prettyPrint=false`

function extractYoutubeId(value) {
  try {
    const parsed = new URL(value)
    if (/youtu\.be$/i.test(parsed.hostname)) return parsed.pathname.slice(1).split('/')[0] || null
    if (/youtube\.com$/i.test(parsed.hostname) || /youtube-nocookie\.com$/i.test(parsed.hostname)) {
      const queryId = parsed.searchParams.get('v')
      if (queryId) return queryId
      const match = parsed.pathname.match(/\/(?:shorts|embed|live)\/([a-zA-Z0-9_-]{11})/i)
      return match?.[1] || null
    }
  } catch {}
  return null
}

function getYoutubeThumbnail(url) {
  const id = extractYoutubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}

function fmtDuration(raw) {
  if (!raw) return null
  const s = String(raw).trim()
  if (/^\d+:\d+/.test(s)) return s
  const secs = Math.floor(Number(s))
  if (isNaN(secs) || secs < 0) return null
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const sec = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

function safeFilename(title) {
  return (title || 'audio').replace(/[^\w\s-]/g, '').trim().slice(0, 80) || 'audio'
}

async function youtubePlayerAudio(url) {
  const videoId = extractYoutubeId(url)
  if (!videoId) return null

  const response = await fetch(YOUTUBE_PLAYER_URL, {
    method: 'POST',
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/json',
      'User-Agent': YOUTUBE_USER_AGENT,
      Origin: 'https://www.youtube.com',
    },
    body: JSON.stringify({
      videoId,
      context: {
        client: {
          clientName: 'ANDROID_VR',
          clientVersion: YOUTUBE_CLIENT_VERSION,
          androidSdkVersion: 32,
          userAgent: YOUTUBE_USER_AGENT,
          deviceMake: 'Oculus',
          deviceModel: 'Quest 3',
          hl: 'en',
          gl: 'US',
        },
      },
    }),
    signal: AbortSignal.timeout(40000),
  })

  if (!response.ok) throw new Error(`YouTube player returned ${response.status}`)
  const data = await response.json()
  if (data.playabilityStatus?.status !== 'OK') {
    throw new Error(data.playabilityStatus?.reason || 'YouTube video is not available')
  }

  const audioFormats = (data.streamingData?.adaptiveFormats || [])
    .filter((format) => format.mimeType?.startsWith('audio/') && format.url)
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))
  const format = audioFormats.find((item) => /audio\/mp4/i.test(item.mimeType)) || audioFormats[0]
  if (!format?.url) return null

  return {
    url: format.url,
    title: data.videoDetails?.title || null,
    thumbnail: data.videoDetails?.thumbnail?.thumbnails?.at(-1)?.url || getYoutubeThumbnail(url),
    duration: fmtDuration(data.videoDetails?.lengthSeconds),
    mimeType: format.mimeType,
    quality: format.bitrate ? `${Math.round(format.bitrate / 1000)}kbps source` : 'YouTube audio',
  }
}

async function convertUrlToMp3(audio, sourceUrl) {
  if (!audio?.url || !sourceUrl || !ffmpegPath) return null

  const tempRoot = path.join(os.tmpdir(), `toosii-audio-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  const input = `${tempRoot}.m4a`
  const output = `${tempRoot}.mp3`

  try {
    const response = await fetch(audio.url, {
      headers: {
        Accept: '*/*',
        Referer: 'https://www.youtube.com/',
        'User-Agent': YOUTUBE_USER_AGENT,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(90000),
    })
    if (!response.ok) throw new Error(`YouTube audio stream returned ${response.status}`)
    const audioBytes = Buffer.from(await response.arrayBuffer())
    if (!audioBytes.length) throw new Error('YouTube audio stream was empty')
    await writeFile(input, audioBytes)

    await execFileAsync(ffmpegPath, [
      '-y',
      '-i', input,
      '-vn',
      '-ar', '44100',
      '-ac', '2',
      '-b:a', '192k',
      '-f', 'mp3',
      output,
    ], { timeout: 90000, maxBuffer: 2 * 1024 * 1024 })

    if (!existsSync(output)) return null
    const buffer = await readFile(output)
    if (!buffer.length) return null
    return { ...audio, buffer, sourceUrl, quality: '192kbps' }
  } catch (error) {
    console.error('[audio:ffmpeg]', error.message)
    return null
  } finally {
    for (const file of [input, output]) {
      if (existsSync(file)) unlink(file).catch(() => {})
    }
  }
}

async function eliteProtechMp3(url) {
  try {
    const response = await fetch(
      `https://eliteprotech-apis.zone.id/ytmp3?url=${encodeURIComponent(url)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(20000) },
    )
    const data = await response.json()
    const download = data.status === true && (data.result?.download || data.result?.download_url)
    if (!download) return null
    return {
      download_url: download,
      title: data.result?.title || null,
      thumbnail: data.result?.thumbnail || getYoutubeThumbnail(url),
      duration: fmtDuration(data.result?.duration),
      quality: 'MP3',
    }
  } catch (error) {
    console.error('[audio:eliteprotech]', error.message)
    return null
  }
}

async function legacyYtdlpAudio(url) {
  const python = await findPython3()
  const ytdlp = getYtdlpPath()
  if (!python || !ytdlp) return null

  try {
    const [info, streamUrl] = await Promise.all([
      ytdlpJson(url, ['--force-ipv4', '--extractor-args', 'youtube:player_client=android_vr']),
      ytdlpGetUrl(url, '140/139/249/250/251', ['--force-ipv4', '--extractor-args', 'youtube:player_client=android_vr']),
    ])
    if (!streamUrl) return null
    return {
      download_url: streamUrl,
      title: info.title || null,
      thumbnail: info.thumbnail || getYoutubeThumbnail(url),
      duration: fmtDuration(info.duration),
      quality: 'YouTube audio fallback',
    }
  } catch (error) {
    console.error('[audio:ytdlp-fallback]', error.message)
    return null
  }
}

export async function POST(request) {
  let payload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 })
  }

  const trimmed = payload?.url?.trim()
  if (!trimmed) return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  if (!/youtube\.com|youtu\.be/i.test(trimmed)) {
    return NextResponse.json(
      { error: 'MP3 download supports YouTube links only. Use the Video Downloader for other platforms.' },
      { status: 400 },
    )
  }

  // Primary serverless path: raw Android VR player API + bundled FFmpeg.
  try {
    const audio = await youtubePlayerAudio(trimmed)
    const converted = await convertUrlToMp3(audio, trimmed)
    if (converted?.buffer) {
      return new Response(converted.buffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${safeFilename(converted.title)}.mp3"`,
          'Content-Length': String(converted.buffer.length),
          'X-Title': converted.title || '',
          'X-Thumbnail': converted.thumbnail || '',
          'X-Duration': converted.duration || '',
          'X-Quality': converted.quality,
          'Cache-Control': 'no-store',
        },
      })
    }

    // If transcoding is unavailable, return the valid direct audio stream so
    // the client still has a usable download instead of a generic 500.
    if (audio?.url) {
      return NextResponse.json({
        download_url: audio.url,
        title: audio.title,
        thumbnail: audio.thumbnail,
        duration: audio.duration,
        quality: 'M4A fallback',
      })
    }
  } catch (error) {
    console.error('[audio:player]', error.message)
  }

  // Secondary direct-MP3 provider for cases where YouTube blocks the player API.
  const external = await eliteProtechMp3(trimmed)
  if (external?.download_url) return NextResponse.json(external)

  // Legacy local yt-dlp path for non-Vercel environments that provide Python.
  const legacy = await legacyYtdlpAudio(trimmed)
  if (legacy?.download_url) return NextResponse.json(legacy)

  return NextResponse.json(
    { error: 'Could not extract audio right now. Please try another public YouTube link in a moment.' },
    { status: 502 },
  )
}
