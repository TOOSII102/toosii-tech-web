export const maxDuration = 120

  function getYoutubeThumbnail(url) {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null
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
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    return `${m}:${String(sec).padStart(2,'0')}`
  }

  
import { NextResponse } from 'next/server'
import { execFile }     from 'child_process'
import { promisify }    from 'util'
import { unlink, readFile } from 'fs/promises'
import { existsSync }   from 'fs'
import path             from 'path'
import os               from 'os'
import { ytdlpJson, ytdlpGetUrl, findPython3, getYtdlpPath } from '../../../../lib/ytdlp'

const execFileAsync = promisify(execFile)

// ── Path 0: EliteProTech API — instant direct MP3 URL (no processing) ────────
async function eliteProtechMp3(url) {
  try {
    const r = await fetch(
      `https://eliteprotech-apis.zone.id/ytmp3?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(20000) }
    )
    const d = await r.json()
    if (d.status === true && d.result?.download) {
      return {
        download_url: d.result.download,
        title:        d.result.title    || null,
        thumbnail: d.result?.thumbnail || getYoutubeThumbnail(url),
        duration: fmtDuration(d.result?.duration),
        quality: 'MP3',
      platform: 'youtube',
      }
    }
  } catch (e) {
    console.error('[audio:eliteprotech]', e.message)
  }
  return null
}

async function convertToMp3(url) {
  const tmp    = path.join(os.tmpdir(), `ytdl-audio-${Date.now()}`)
  const outM4a = tmp + '.m4a'
  const outMp3 = tmp + '.mp3'

  const python = await findPython3()
  const ytdlp  = getYtdlpPath()
  if (!python || !ytdlp) return null

  try {
    // Step 1 — metadata
    const info = await ytdlpJson(url)
    const title     = info.title     || null
    const thumbnail = info.thumbnail || null
    const duration  = info.duration  || null

    // Step 2 — download audio stream
    await execFileAsync(python, [
      ytdlp,
      '--no-warnings', '--no-playlist',
      '-f', 'bestaudio[ext=m4a]/bestaudio',
      '-o', outM4a,
      url,
    ], { timeout: 90000, cwd: '/tmp' })

    if (!existsSync(outM4a)) return null

    // Step 3 — convert to MP3 with ffmpeg
    await execFileAsync('ffmpeg', [
      '-y', '-i', outM4a,
      '-vn', '-ar', '44100', '-ac', '2', '-ab', '192k', '-f', 'mp3',
      outMp3,
    ], { timeout: 60000 })

    if (!existsSync(outMp3)) return null

    const mp3Buffer = await readFile(outMp3)
    return { buffer: mp3Buffer, title, thumbnail, duration, quality: '192kbps' }
  } catch (e) {
    console.error('[audio:convert]', e.message)
    return null
  } finally {
    for (const f of [outM4a, outMp3]) {
      if (existsSync(f)) unlink(f).catch(() => {})
    }
  }
}

async function getAudioUrl(url) {
  const python = await findPython3()
  const ytdlp  = getYtdlpPath()
  if (!python || !ytdlp) return null

  const [info, streamUrl] = await Promise.all([
    ytdlpJson(url),
    ytdlpGetUrl(url, 'bestaudio[ext=m4a]/bestaudio'),
  ])

  if (!streamUrl) return null
  return {
    download_url: streamUrl,
    title:        info.title     || null,
    thumbnail:    info.thumbnail || null,
    duration:     info.duration  || null,
    quality:      'M4A',
  }
}

export async function POST(request) {
  const { url } = await request.json()
  if (!url?.trim()) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  const trimmed = url.trim()

  if (!/youtube\.com|youtu\.be/i.test(trimmed)) {
    return NextResponse.json(
      { error: 'MP3 download supports YouTube links only. Use the Video Downloader for other platforms.' },
      { status: 400 }
    )
  }

  // ── Path 0: EliteProTech — fastest, returns CDN MP3 URL immediately ─────────
  try {
    const ep = await eliteProtechMp3(trimmed)
    if (ep?.download_url) {
      console.log('[audio:eliteprotech] success')
      return NextResponse.json({
        download_url: ep.download_url,
        title:        ep.title,
        thumbnail:    ep.thumbnail,
        quality:      ep.quality,
        duration:     ep.duration != null ? String(ep.duration) : null,
      })
    }
  } catch (e) {
    console.error('[audio:eliteprotech]', e.message)
  }

  // ── Path A: full MP3 conversion with ffmpeg ──────────────────────────────
  try {
    const result = await convertToMp3(trimmed)
    if (result?.buffer) {
      const safeName = (result.title || 'audio').replace(/[^\w\s-]/g, '').trim().slice(0, 80) || 'audio'
      return new Response(result.buffer, {
        status: 200,
        headers: {
          'Content-Type':        'audio/mpeg',
          'Content-Disposition': `attachment; filename="${safeName}.mp3"`,
          'Content-Length':      String(result.buffer.length),
          'X-Title':             result.title    || '',
          'X-Thumbnail':         result.thumbnail || '',
          'X-Duration':          result.duration != null ? String(result.duration) : '',
          'X-Quality':           result.quality  || '',
          'Cache-Control':       'no-store',
        },
      })
    }
  } catch (e) {
    console.error('[audio:ytdlp+ffmpeg]', e.message)
  }

  // ── Path B: fallback — return CDN audio URL for client to download ────────
  try {
    const urlResult = await getAudioUrl(trimmed)
    if (urlResult?.download_url) {
      return NextResponse.json({
        download_url: urlResult.download_url,
        title:        urlResult.title,
        thumbnail:    urlResult.thumbnail,
        quality:      urlResult.quality,
        duration:     urlResult.duration != null ? String(urlResult.duration) : null,
      })
    }
  } catch (e) {
    console.error('[audio:url-fallback]', e.message)
  }

  return NextResponse.json(
    { error: 'Could not extract audio. Please ensure it is a valid, public YouTube URL and try again.' },
    { status: 500 }
  )
}
