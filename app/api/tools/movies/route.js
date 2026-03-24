import { NextResponse } from 'next/server'

const BASE = 'https://movieapi.xcasper.space'

const HDRS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
  'Origin':  'https://movieapi.xcasper.space',
  'Referer': 'https://movieapi.xcasper.space/',
  'Accept':  'application/json',
}

async function up(url) {
  const res = await fetch(url, { headers: HDRS, signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`Upstream ${res.status}`)
  return res.json()
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || 'trending'
    const q      = searchParams.get('q')    || ''
    const id     = searchParams.get('id')   || ''
    const page   = searchParams.get('page') || '1'
    const type   = searchParams.get('type') || ''

    let url
    switch (action) {
      case 'trending':
        url = `${BASE}/api/trending`
        break
      case 'hot':
        url = `${BASE}/api/hot`
        break
      case 'search':
        url = `${BASE}/api/search?keyword=${encodeURIComponent(q)}&page=${page}&perPage=24${type ? `&subjectType=${type}` : ''}`
        break
      case 'detail':
        url = `${BASE}/api/rich-detail?subjectId=${encodeURIComponent(id)}`
        break
      case 'play':
        url = `${BASE}/api/play?subjectId=${encodeURIComponent(id)}`
        break
      case 'recommend':
        url = `${BASE}/api/recommend?subjectId=${encodeURIComponent(id)}&page=1&perPage=12`
        break
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    const data = await up(url)
    if (data.code && data.code !== 200) {
      return NextResponse.json({ error: data.error || 'Upstream error' }, { status: 502 })
    }
    return NextResponse.json(data)
  } catch (e) {
    console.error('[movies]', e.message)
    return NextResponse.json({ error: 'Movies service unavailable. Please try again.' }, { status: 500 })
  }
}
