export const maxDuration = 120

  function getYoutubeThumbnail(url) {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null
  }

  async function getYoutubeMetadata(url) {
    try {
      const response = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
        { signal: AbortSignal.timeout(10000), cache: 'no-store' },
      )
      if (!response.ok) return {}
      const data = await response.json()
      return {
        title: data.title || null,
        author: data.author_name || null,
        thumbnail: data.thumbnail_url || null,
      }
    } catch (e) {
      console.error('[audio:metadata]', e.message)
      return {}
    }
  }

  function buildAudioFilename(title, author) {
    const clean = value => String(value || '')
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80)
    const safeTitle = clean(title)
    const safeAuthor = clean(author)
    if (safeTitle && safeAuthor && safeTitle.toLowerCase().includes(safeAuthor.toLowerCase())) return safeTitle
    return [safeAuthor, safeTitle].filter(Boolean).join(' - ') || 'audio'
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
import { referenceDownload } from '../../../../lib/referenceDownloadApi'
import { tagMp3Buffer } from '../../../../lib/id3'

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
    const author    = info.uploader || info.channel || info.artist || info.creator || null
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
      '-vn', '-ar', '44100', '-ac', '2', '-b:a', '128k', '-f', 'mp3',
      outMp3,
    ], { timeout: 60000 })

    if (!existsSync(outMp3)) return null

    const mp3Buffer = await readFile(outMp3)
    const taggedBuffer = await tagMp3Buffer(mp3Buffer, {
      title,
      artist: author,
      album: 'Toosii Downloads',
      thumbnail,
    })
    return { buffer: taggedBuffer, title, author, thumbnail, duration, quality: '128kbps' }
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
    author:       info.uploader  || info.channel || info.artist || info.creator || null,
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

  // ── Path 0: reference downloader API — direct CDN MP3 URL ───────────────────
  try {
    const [reference, metadata] = await Promise.all([
      referenceDownload(trimmed, 'audio'),
      getYoutubeMetadata(trimmed),
    ])
    if (reference?.download_url) {
      console.log('[audio:reference] success')
      return NextResponse.json({
        download_url: reference.download_url,
        title: metadata.title,
        author: metadata.author,
        thumbnail: metadata.thumbnail || getYoutubeThumbnail(trimmed),
        quality: reference.quality || '64kbps MP3',
        duration: null,
      })
    }
  } catch (e) {
    console.error('[audio:reference]', e.message)
  }

  // ── Path 1: EliteProTech — fastest legacy provider ─────────────────────────
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
      const safeName = buildAudioFilename(result.title, result.author)
      return new Response(result.buffer, {
        status: 200,
        headers: {
          'Content-Type':        'audio/mpeg',
          'Content-Disposition': `attachment; filename="${safeName}.mp3"`,
          'Content-Length':      String(result.buffer.length),
          'X-Title':             result.title    || '',
          'X-Author':            result.author   || '',
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
        author:       urlResult.author,
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
