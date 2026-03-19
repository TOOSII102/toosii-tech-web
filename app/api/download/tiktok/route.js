import { NextResponse } from 'next/server'

export async function POST(request) {
  const { url } = await request.json()
  if (!url?.trim()) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  try {
    const res = await fetch(
      `https://tikwm.com/api/?url=${encodeURIComponent(url.trim())}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(20000) }
    )
    const data = await res.json()
    if (data.code === 0 && data.data) {
      const d = data.data
      return NextResponse.json({
        platform: 'tiktok',
        download_url: d.play,           // no watermark
        download_wm:  d.wmplay || null, // with watermark
        title:     d.title,
        thumbnail: d.cover,
        author:    d.author?.nickname || null,
        duration:  d.duration ? `${d.duration}s` : null,
        music:     d.music || null,
      })
    }
    return NextResponse.json({ error: data.msg || 'Could not fetch TikTok video.' }, { status: 500 })
  } catch (e) {
    console.error('[tiktok]', e.message)
    return NextResponse.json({ error: 'Could not download TikTok video. Try again.' }, { status: 500 })
  }
}
