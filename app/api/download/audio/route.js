import { NextResponse } from 'next/server'
import ytdl from '@distube/ytdl-core'

const GT  = 'https://api.giftedtech.co.ke/api/download'
const KEY = 'gifted'
const TO  = 25000

function fmt(sec) {
  if (!sec || isNaN(sec)) return null
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

async function gt(path) {
  const res = await fetch(`${GT}/${path}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(TO),
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
      { error: 'MP3 download supports YouTube links only. Use the Video Downloader for other platforms.' },
      { status: 400 }
    )
  }

  // Primary: GiftedTech ytmp3
  try {
    const d = await gt(`ytmp3?apikey=${KEY}&url=${enc}&quality=128kbps`)
    if (d.success && d.result?.download_url) {
      return NextResponse.json({
        download_url: d.result.download_url,
        title: d.result.title || null,
        thumbnail: d.result.thumbnail || null,
        duration: d.result.duration || null,
        quality: d.result.quality || '128kbps',
      })
    }
  } catch (e) { console.error('[gt-ytmp3]', e.message) }

  // Fallback: ytdl-core audio stream
  if (ytdl.validateURL(trimmed)) {
    try {
      const info = await ytdl.getInfo(trimmed)
      const audio = ytdl
        .filterFormats(info.formats, 'audioonly')
        .filter(f => f.url)
        .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0]

      if (audio?.url) {
        const vd = info.videoDetails
        return NextResponse.json({
          download_url: audio.url,
          title: vd.title,
          thumbnail: vd.thumbnails?.at(-1)?.url || null,
          duration: fmt(parseInt(vd.lengthSeconds)),
          author: vd.author?.name || null,
        })
      }
    } catch (e) { console.error('[ytdl-core audio]', e.message) }
  }

  return NextResponse.json(
    { error: 'Could not extract audio. Make sure it is a valid YouTube URL and try again.' },
    { status: 500 }
  )
}
