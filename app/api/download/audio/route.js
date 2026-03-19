import { NextResponse } from 'next/server'

const TIMEOUT = 30000

// loader.to — no API key, just polls until done
async function loaderTo(url) {
  const initRes = await fetch(
    `https://loader.to/ajax/download.php?format=mp3&url=${encodeURIComponent(url)}`,
    { signal: AbortSignal.timeout(12000) }
  )
  const init = await initRes.json()
  if (!init.success || !init.id) return null

  // Poll up to 15 times (45 seconds max)
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 3000))
    try {
      const prog = await fetch(
        `https://loader.to/api/progress?id=${init.id}`,
        { signal: AbortSignal.timeout(8000) }
      ).then(r => r.json())
      if (prog.download_url) {
        return { download_url: prog.download_url }
      }
    } catch {}
  }
  return null
}

export async function POST(request) {
  const { url } = await request.json()
  if (!url?.trim()) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  const trimmed = url.trim()

  if (!/youtube\.com|youtu\.be/i.test(trimmed)) {
    return NextResponse.json(
      { error: 'MP3 download supports YouTube links only. Use the Video Downloader for other platforms.' },
      { status: 400 }
    )
  }

  try {
    // Get YouTube metadata from oEmbed (free, no key)
    let title = null, thumbnail = null
    try {
      const meta = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(trimmed)}&format=json`,
        { signal: AbortSignal.timeout(6000) }
      ).then(r => r.json())
      title = meta.title || null
      thumbnail = meta.thumbnail_url || null
    } catch {}

    const result = await loaderTo(trimmed)
    if (result?.download_url) {
      return NextResponse.json({
        download_url: result.download_url,
        title,
        thumbnail,
        quality: '128kbps',
      })
    }
  } catch (e) {
    console.error('[audio]', e.message)
  }

  return NextResponse.json(
    { error: 'Could not extract audio. Make sure it is a valid YouTube URL and try again.' },
    { status: 500 }
  )
}
