import { NextResponse } from 'next/server'

  const BASE = 'https://movieapi.xcasper.space'
  const SITE = 'https://xcasper.space'
  const UA   = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  const HDRS = { 'User-Agent': UA, 'Referer': SITE + '/', 'Origin': SITE, 'Accept': 'application/json' }

  async function xc(path) {
    const r = await fetch(BASE + path, { headers: HDRS, signal: AbortSignal.timeout(12000) })
    if (!r.ok) throw new Error('xcasper ' + r.status + ': ' + path)
    return r.json()
  }

  export async function GET(req) {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || 'trending'
    const id     = searchParams.get('id')     || ''
    const q      = searchParams.get('q')      || ''
    const type   = searchParams.get('type')   || ''
    const res    = searchParams.get('res')    || '720'
    const se     = searchParams.get('se')     || ''
    const ep     = searchParams.get('ep')     || ''

    /* ─── Option B: Range-aware server proxy ─── */
    if (action === 'stream') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      let url = BASE + '/api/bff/stream?subjectId=' + encodeURIComponent(id) + '&resolution=' + res
      if (se && ep) url += '&se=' + se + '&ep=' + ep
      try {
        const range    = req.headers.get('range') || ''
        const upstream = await fetch(url, {
          headers: { 'User-Agent': UA, 'Referer': SITE + '/', 'Origin': SITE, 'Accept': '*/*',
            ...(range ? { Range: range } : {}) },
          signal: AbortSignal.timeout(30000),
        })
        const out = new Headers({ 'Access-Control-Allow-Origin': '*' })
        for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
          const v = upstream.headers.get(h)
          if (v) out.set(h, v)
        }
        return new Response(upstream.body, { status: upstream.status, headers: out })
      } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 })
      }
    }

    /* ─── Regular xcasper API actions ─── */
    try {
      switch (action) {
        case 'trending':  return NextResponse.json(await xc('/api/trending'))
        case 'hot':       return NextResponse.json(await xc('/api/hot'))
        case 'search':    return NextResponse.json(await xc('/api/search?keyword=' + encodeURIComponent(q) + (type ? '&type=' + type : '')))
        case 'detail':    return NextResponse.json(await xc('/api/rich-detail?subjectId=' + encodeURIComponent(id)))
        case 'recommend': return NextResponse.json(await xc('/api/recommend?subjectId=' + encodeURIComponent(id) + '&page=1&perPage=12'))
        default: return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
      }
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 502 })
    }
  }
  