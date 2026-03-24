import { NextResponse } from 'next/server'

const BASE = Buffer.from('aHR0cHM6Ly9tb3ZpZWFwaS54Y2FzcGVyLnNwYWNl', 'base64').toString()

const HDRS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
  'Origin':  BASE,
  'Referer': BASE + '/',
  'Accept':  'application/json',
}

async function up(url) {
  const res = await fetch(url, { headers: HDRS, signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`Upstream ${res.status}`)
  return res.json()
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') || 'trending'
  const q      = searchParams.get('q')    || ''
  const id     = searchParams.get('id')   || ''
  const page   = searchParams.get('page') || '1'
  const type   = searchParams.get('type') || ''
  const res    = searchParams.get('res')  || ''
  const title  = searchParams.get('title')|| 'movie'

  if (action === 'download') {
    try {
      if (!id || !res) return NextResponse.json({ error: 'Missing id or res' }, { status: 400 })

      const data    = await up(`${BASE}/api/play?subjectId=${encodeURIComponent(id)}`)
      const streams = data?.data?.streams || []
      const stream  = streams.find(s => String(s.resolutions) === String(res)) || streams[0]

      if (!stream) return NextResponse.json({ error: 'Quality not available' }, { status: 404 })

      const dlUrl  = stream.downloadUrl || stream.url
      const vidRes = await fetch(dlUrl, {
        headers: { 'User-Agent': HDRS['User-Agent'], 'Referer': HDRS['Referer'] },
        signal: AbortSignal.timeout(30000),
      })

      if (!vidRes.ok) return NextResponse.json({ error: 'CDN unavailable' }, { status: 502 })

      const safe     = title.replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/\s+/g, '_') || 'movie'
      const filename = `${safe}_${res}p.mp4`

      const outHeaders = new Headers()
      outHeaders.set('Content-Type',        vidRes.headers.get('content-type') || 'video/mp4')
      outHeaders.set('Content-Disposition', `attachment; filename="${filename}"`)
      outHeaders.set('Cache-Control',       'no-store')
      const cl = vidRes.headers.get('content-length')
      if (cl) outHeaders.set('Content-Length', cl)

      return new Response(vidRes.body, { status: 200, headers: outHeaders })
    } catch (e) {
      console.error('[movies:download]', e.message)
      return NextResponse.json({ error: 'Download failed. Try again.' }, { status: 500 })
    }
  }

  try {
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
