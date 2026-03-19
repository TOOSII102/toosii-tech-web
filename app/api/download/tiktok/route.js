import { NextResponse } from 'next/server'

const GT_KEY = process.env.GIFTED_API_KEY || 'gifted'

export async function POST(request) {
  const { url } = await request.json()
  if (!url?.trim()) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  const trimmed = url.trim()
  const enc     = encodeURIComponent(trimmed)

  // Source 1: tikwm.com — keyless, no-watermark
  try {
    const res  = await fetch(
      `https://tikwm.com/api/?url=${enc}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(20000) }
    )
    const data = await res.json()
    if (data.code === 0 && data.data) {
      const d = data.data
      return NextResponse.json({
        platform:     'tiktok',
        download_url: d.play,
        download_wm:  d.wmplay || null,
        title:        d.title,
        thumbnail:    d.cover,
        author:       d.author?.nickname || null,
        duration:     d.duration ? `${d.duration}s` : null,
        music:        d.music || null,
      })
    }
  } catch (e) { console.error('[tiktok:tikwm]', e.message) }

  // Source 2: GiftedTech
  try {
    const res  = await fetch(
      `https://api.giftedtech.co.ke/api/download/tiktok?apikey=${GT_KEY}&url=${enc}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(20000) }
    )
    const d = await res.json()
    if (d.success && (d.result?.video || d.result?.download_url)) {
      return NextResponse.json({
        platform:     'tiktok',
        download_url: d.result.video || d.result.download_url,
        title:        d.result.title     || null,
        thumbnail:    d.result.thumbnail || null,
        author:       d.result.author    || null,
        duration:     d.result.duration  || null,
      })
    }
  } catch (e) { console.error('[tiktok:gifted]', e.message) }

  return NextResponse.json(
    { error: 'Could not download TikTok video. Make sure the link is public and try again.' },
    { status: 500 }
  )
}
