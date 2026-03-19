import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const GIFTED_KEY = 'gifted'
const GIFTED_BASE = 'https://api.giftedtech.co.ke/api'

async function searchYT(q: string): Promise<{ url: string; title: string; thumbnail: string; duration: string } | null> {
  try {
    const res = await fetch(`${GIFTED_BASE}/search/ytsearch?apikey=${GIFTED_KEY}&q=${encodeURIComponent(q)}`, {
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    if (data.success && data.result?.[0]) {
      const r = data.result[0]
      return {
        url: r.url || r.link || '',
        title: r.title || q,
        thumbnail: r.thumbnail || r.image || '',
        duration: r.duration || r.timestamp || '--:--',
      }
    }
  } catch {}
  return null
}

function isYoutubeUrl(s: string) {
  return /youtube\.com\/watch|youtu\.be\//.test(s)
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim()
  if (!q) return NextResponse.json({ error: 'Query required' }, { status: 400 })

  let videoUrl = ''
  let title = q
  let thumbnail = ''
  let duration = '--:--'

  if (isYoutubeUrl(q)) {
    videoUrl = q
  } else {
    const searched = await searchYT(q)
    if (!searched?.url) return NextResponse.json({ error: 'No results found. Try a different search.' }, { status: 404 })
    videoUrl = searched.url
    title = searched.title
    thumbnail = searched.thumbnail
    duration = searched.duration
  }

  try {
    const res = await fetch(
      `${GIFTED_BASE}/download/ytmp3?apikey=${GIFTED_KEY}&url=${encodeURIComponent(videoUrl)}`,
      { signal: AbortSignal.timeout(35000) }
    )
    const data = await res.json()
    if (data.success && data.result?.download_url) {
      return NextResponse.json({
        title: data.result.title || title,
        thumbnail: data.result.thumbnail || thumbnail,
        duration: data.result.duration || duration,
        download_url: data.result.download_url,
      })
    }

    if (data.success && data.result?.mediaUrl) {
      return NextResponse.json({
        title: data.result.title || title,
        thumbnail: data.result.thumbnail || thumbnail,
        duration: data.result.duration || duration,
        download_url: data.result.mediaUrl,
      })
    }

    return NextResponse.json({ error: data.message || 'Failed to convert to MP3.' }, { status: 500 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Conversion failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
