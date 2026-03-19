import { NextResponse } from 'next/server'
import ytdl from '@distube/ytdl-core'

const GT_BASE = 'https://api.giftedtech.co.ke/api/download'
const GT_KEY  = 'gifted'
const TIMEOUT = 25000

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return null
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

async function gtFetch(path) {
  const res = await fetch(`${GT_BASE}/${path}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(TIMEOUT),
  })
  return res.json()
}

export async function POST(request) {
  const { url } = await request.json()
  if (!url?.trim()) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  const trimmed = url.trim()
  const enc = encodeURIComponent(trimmed)

  if (!/youtube\.com|youtu\.be/i.test(trimmed)) {
    return NextResponse.json(
      { error: 'MP3 download supports YouTube links only. For video downloads use the Video Downloader.' },
      { status: 400 }
    )
  }

  // Primary: ytdl-core (fastest, no rate limit)
  if (ytdl.validateURL(trimmed)) {
    try {
      const info = await ytdl.getInfo(trimmed, {
        requestOptions: { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
      })
      const audio = ytdl
        .filterFormats(info.formats, 'audioonly')
        .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0]

      if (audio?.url) {
        const vd = info.videoDetails
        return NextResponse.json({
          download_url: audio.url,
          title: vd.title,
          thumbnail: vd.thumbnails?.at(-1)?.url || null,
          duration: formatDuration(parseInt(vd.lengthSeconds)),
          author: vd.author?.name || null,
        })
      }
    } catch (e) { console.error('[ytdl-core audio]', e.message) }
  }

  // Fallback: GiftedTech ytmp3
  try {
    const d = await gtFetch(`ytmp3?apikey=${GT_KEY}&url=${enc}&quality=128kbps`)
    if (d.success && d.result?.download_url) {
      return NextResponse.json({
        download_url: d.result.download_url,
        title: d.result.title,
        thumbnail: null,
        duration: null,
        quality: d.result.quality,
      })
    }
  } catch (e) { console.error('[gtmp3]', e.message) }

  return NextResponse.json(
    { error: 'Could not extract audio. Make sure it is a valid YouTube URL and try again.' },
    { status: 500 }
  )
}
