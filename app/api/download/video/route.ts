import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const GIFTED_KEY = 'gifted'
const GIFTED_BASE = 'https://api.giftedtech.co.ke/api'

async function searchYT(q: string): Promise<string | null> {
  try {
    const res = await fetch(`${GIFTED_BASE}/search/ytsearch?apikey=${GIFTED_KEY}&q=${encodeURIComponent(q)}`, {
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    if (data.success && data.result?.[0]?.url) return data.result[0].url
    if (data.success && data.result?.[0]?.link) return data.result[0].link
  } catch {}
  return null
}

function isYoutubeUrl(s: string) {
  return /youtube\.com\/watch|youtu\.be\//.test(s)
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim()
  if (!q) return NextResponse.json({ error: 'Query required' }, { status: 400 })

  let videoUrl = isYoutubeUrl(q) ? q : await searchYT(q)
  if (!videoUrl) return NextResponse.json({ error: 'No video found. Try a different search.' }, { status: 404 })

  try {
    const res = await fetch(
      `${GIFTED_BASE}/download/ytv?apikey=${GIFTED_KEY}&url=${encodeURIComponent(videoUrl)}`,
      { signal: AbortSignal.timeout(30000) }
    )
    const data = await res.json()
    if (!data.success || !data.result?.download_url) {
      return NextResponse.json({ error: data.message || 'Failed to get download link.' }, { status: 500 })
    }
    return NextResponse.json({
      title: data.result.title || 'Unknown Title',
      thumbnail: data.result.thumbnail || '',
      quality: data.result.quality || '720p',
      duration: data.result.duration || '--:--',
      download_url: data.result.download_url,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Download failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
