import { NextResponse } from 'next/server'
import ytdl from '@distube/ytdl-core'

export async function POST(request) {
  const { url } = await request.json()
  if (!url || !url.trim()) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  const trimmed = url.trim()

  // Try ytdl-core first (YouTube URLs)
  if (ytdl.validateURL(trimmed)) {
    try {
      const info = await ytdl.getInfo(trimmed, {
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
          }
        }
      })
      const videoDetails = info.videoDetails

      // Try to get a video+audio combined format (mp4)
      const mp4Formats = info.formats.filter(f =>
        f.container === 'mp4' && f.hasVideo && f.hasAudio
      ).sort((a, b) => (b.height || 0) - (a.height || 0))

      // Fallback: best video-only (client handles audio separately)
      const videoOnlyFormats = ytdl.filterFormats(info.formats, 'videoonly')
        .filter(f => f.container === 'mp4')
        .sort((a, b) => (b.height || 0) - (a.height || 0))

      const chosen = mp4Formats[0] || videoOnlyFormats[0]

      if (chosen?.url) {
        return NextResponse.json({
          download_url: chosen.url,
          title: videoDetails.title,
          thumbnail: videoDetails.thumbnails?.at(-1)?.url || null,
          quality: chosen.qualityLabel || `${chosen.height}p` || '720p',
          size: chosen.contentLength
            ? `${(parseInt(chosen.contentLength) / (1024 * 1024)).toFixed(1)} MB`
            : null,
          author: videoDetails.author?.name || null,
        })
      }
    } catch (e) {
      console.error('[ytdl video]', e.message)
    }
  }

  // Fallback for non-YouTube or ytdl failure: fabdl mp4
  try {
    const result = await tryFabdlVideo(trimmed)
    if (result) return NextResponse.json(result)
  } catch {}

  return NextResponse.json(
    { error: 'Could not fetch video. Try a direct YouTube link (e.g. https://youtube.com/watch?v=...)' },
    { status: 500 }
  )
}

async function tryFabdlVideo(url) {
  const r = await fetch(`https://api.fabdl.com/youtube/mp4?url=${encodeURIComponent(url)}&quality=720`, {
    signal: AbortSignal.timeout(20000)
  })
  const d = await r.json()

  const dlUrl = d?.result?.download_url || d?.result?.url
  if (!dlUrl) return null

  return {
    download_url: dlUrl,
    title: d?.result?.title || null,
    thumbnail: d?.result?.image || null,
    quality: '720p',
    size: null,
  }
}
