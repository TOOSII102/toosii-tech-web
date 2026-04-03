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

    /* ── Option B: Range-aware stream proxy ── */
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

    /* ── Download: same as stream but forces file save ── */
    if (action === 'download') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      let url = BASE + '/api/bff/stream?subjectId=' + encodeURIComponent(id) + '&resolution=' + res
      if (se && ep) url += '&se=' + se + '&ep=' + ep
      try {
        const upstream = await fetch(url, {
          headers: { 'User-Agent': UA, 'Referer': SITE + '/', 'Origin': SITE, 'Accept': '*/*' },
          signal: AbortSignal.timeout(30000),
        })
        const ext      = (upstream.headers.get('content-type') || '').includes('mp4') ? 'mp4' : 'mp4'
        const filename = 'movie-' + id.slice(0, 12) + '-' + res + 'p.' + ext
        const out      = new Headers({
          'Access-Control-Allow-Origin': '*',
          'Content-Disposition':         'attachment; filename="' + filename + '"',
          'Content-Type':                upstream.headers.get('content-type') || 'video/mp4',
        })
        const cl = upstream.headers.get('content-length')
        if (cl) out.set('Content-Length', cl)
        return new Response(upstream.body, { status: upstream.status, headers: out })
      } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 })
      }
    }

    /* ── Play: resolve imdb_id via ShowBox + return stream info ── */
    if (action === 'play') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      try {
        const detail = await xc('/api/rich-detail?subjectId=' + encodeURIComponent(id))
        const d      = detail?.data || {}
        const isTV   = (d.subjectType || 1) === 2
        const title  = (d.title || '').replace(/\s*S\d.*/i, '').trim()
        const sbType = isTV ? 'tv' : 'movie'

        const sbSearch = await fetch(
          BASE + '/api/showbox/search?keyword=' + encodeURIComponent(title) + '&type=' + sbType,
          { headers: HDRS, signal: AbortSignal.timeout(10000) }
        ).then(r => r.json())
        const sbItem = sbSearch?.data?.[0]

        let imdbId = null, seasons = []
        if (sbItem) {
          if (!isTV) {
            const m = await fetch(BASE + '/api/showbox/movie?id=' + sbItem.id, { headers: HDRS, signal: AbortSignal.timeout(10000) }).then(r => r.json())
            imdbId = m?.data?.imdb_id || null
          } else {
            const t = await fetch(BASE + '/api/showbox/tv?id=' + sbItem.id + '&season=1&episode=1', { headers: HDRS, signal: AbortSignal.timeout(10000) }).then(r => r.json())
            imdbId  = t?.data?.imdb_id || null
            seasons = Array.isArray(t?.data?.season) ? t.data.season : [1]
          }
        }

        return NextResponse.json({ data: { isTV, imdbId, seasons } })
      } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 })
      }
    }

    /* ── Standard xcasper API actions ── */
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
  