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

      // Get best audio-only format
      const audioFormats = ytdl.filterFormats(info.formats, 'audioonly')
      const bestAudio = audioFormats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0]

      if (bestAudio?.url) {
        return NextResponse.json({
          download_url: bestAudio.url,
          title: videoDetails.title,
          thumbnail: videoDetails.thumbnails?.at(-1)?.url || null,
          duration: formatDuration(parseInt(videoDetails.lengthSeconds)),
          author: videoDetails.author?.name || null,
          views: videoDetails.viewCount || null,
        })
      }
    } catch (e) {
      console.error('[ytdl audio]', e.message)
    }
  }

  // Fallback: loader.to (works for YouTube on Vercel)
  try {
    const result = await tryLoaderTo(trimmed)
    if (result) return NextResponse.json(result)
  } catch {}

  // Fallback: fabdl (YouTube)
  try {
    const result = await tryFabdl(trimmed)
    if (result) return NextResponse.json(result)
  } catch {}

  return NextResponse.json(
    { error: 'Could not extract audio. Make sure it is a valid YouTube URL and try again.' },
    { status: 500 }
  )
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return null
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

async function tryLoaderTo(url) {
  const r = await fetch(`https://loader.to/api/button/?url=${encodeURIComponent(url)}&f=mp3`, {
    signal: AbortSignal.timeout(10000)
  })
  const d = await r.json()
  if (!d.id) return null

  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const prog = await fetch(`https://loader.to/api/progress.php?id=${d.id}`, {
      signal: AbortSignal.timeout(8000)
    }).then(r => r.json())
    if (prog.success && prog.download_url) {
      return { download_url: prog.download_url }
    }
  }
  return null
}

async function tryFabdl(url) {
  const info = await fetch(`https://api.fabdl.com/youtube/get-info?url=${encodeURIComponent(url)}`, {
    signal: AbortSignal.timeout(12000)
  }).then(r => r.json())

  if (!info?.result?.mp3_task_url) return null

  const task = await fetch(info.result.mp3_task_url, {
    signal: AbortSignal.timeout(10000)
  }).then(r => r.json())

  const tid = task?.result?.tid
  if (!tid) return null

  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const prog = await fetch(`https://api.fabdl.com/youtube/mp3-convert-task/progress?tid=${tid}`, {
      signal: AbortSignal.timeout(8000)
    }).then(r => r.json()).catch(() => null)

    const dl = prog?.result?.download_url || prog?.result?.url
    if (dl) {
      return {
        download_url: dl,
        title: info.result.title || null,
        thumbnail: info.result.image || null,
        duration: formatDuration(info.result.duration),
      }
    }
  }
  return null
}
