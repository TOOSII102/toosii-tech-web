import { NextResponse } from 'next/server'
import { brandPublicResponse } from '../../../../lib/brandPublicResponse'

const BASE = 'https://movieapi.xcasper.space'
const SITE = 'https://xcasper.space'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

const BROWSER_HDRS = {
  'User-Agent':         UA,
  'Referer':            SITE + '/',
  'Origin':             SITE,
  'Accept-Language':    'en-US,en;q=0.9',
  'Accept-Encoding':    'identity',
  'Connection':         'keep-alive',
  'Sec-Fetch-Dest':     'video',
  'Sec-Fetch-Mode':     'no-cors',
  'Sec-Fetch-Site':     'same-origin',
  'Sec-Ch-Ua':          '"Not_A Brand";v="8", "Chromium";v="122", "Google Chrome";v="122"',
  'Sec-Ch-Ua-Mobile':   '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
}

const JSON_HDRS = {
  ...BROWSER_HDRS,
  'Accept':         'application/json',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
}

async function xc(path) {
  const r = await fetch(BASE + path, { headers: JSON_HDRS, signal: AbortSignal.timeout(12000) })
  if (!r.ok) throw new Error('xcasper ' + r.status + ': ' + path)
  return r.json()
}

function xcStreamUrl(id, res, se, ep) {
  let url = BASE + '/api/bff/stream?subjectId=' + encodeURIComponent(id) + '&resolution=' + res
  if (se && ep) url += '&se=' + se + '&ep=' + ep
  return url
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

  /* ── Stream proxy: full browser headers + Range forwarding ── */
  if (action === 'stream') {
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const url   = xcStreamUrl(id, res, se, ep)
    const range = req.headers.get('range') || ''
    try {
      const upstream = await fetch(url, {
        headers: {
          ...BROWSER_HDRS,
          'Accept': 'video/mp4,video/webm,video/*,*/*;q=0.9',
          ...(range ? { Range: range } : {}),
        },
        signal: AbortSignal.timeout(30000),
      })
      const out = new Headers({
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      })
      for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
        const v = upstream.headers.get(h)
        if (v) out.set(h, v)
      }
      return new Response(upstream.body, { status: upstream.status, headers: out })
    } catch (e) {
      console.error('[movies:stream]', e.message)
      return NextResponse.json({ error: 'Movie stream is temporarily unavailable. Try another server or try again shortly.' }, { status: 502 })
    }
  }

  /* ── Download: full browser headers + Content-Disposition ── */
  if (action === 'download') {
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const url = xcStreamUrl(id, res, se, ep)
    try {
      const upstream = await fetch(url, {
        headers: { ...BROWSER_HDRS, 'Accept': 'video/mp4,video/webm,video/*,*/*;q=0.9' },
        signal: AbortSignal.timeout(60000),
      })
      if (!upstream.ok) {
        return NextResponse.json(
          { error: 'Stream source unavailable (' + upstream.status + '). Try again later.' },
          { status: 502 }
        )
      }
      const ct = upstream.headers.get('content-type') || ''
      if (!ct.includes('video') && !ct.includes('octet-stream') && !ct.includes('mp4')) {
        return NextResponse.json(
          { error: 'Source did not return a video file. Stream provider may be down.' },
          { status: 502 }
        )
      }
      const out = new Headers({
        'Content-Disposition': 'attachment; filename="movie-' + res + 'p.mp4"',
        'Content-Type':        ct || 'video/mp4',
        'Cache-Control':       'no-store',
      })
      const cl = upstream.headers.get('content-length')
      if (cl) out.set('Content-Length', cl)
      return new Response(upstream.body, { status: 200, headers: out })
    } catch (e) {
      return NextResponse.json({ error: 'Download failed: ' + e.message }, { status: 502 })
    }
  }

  /* ── Play: resolve imdb_id via ShowBox ── */
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
        { headers: JSON_HDRS, signal: AbortSignal.timeout(10000) }
      ).then(r => r.json())

      const sbItem = sbSearch?.data?.[0]
      let imdbId = null, seasons = []

      if (sbItem) {
        if (!isTV) {
          const m = await fetch(
            BASE + '/api/showbox/movie?id=' + sbItem.id,
            { headers: JSON_HDRS, signal: AbortSignal.timeout(10000) }
          ).then(r => r.json())
          imdbId = m?.data?.imdb_id || null
        } else {
          const t = await fetch(
            BASE + '/api/showbox/tv?id=' + sbItem.id + '&season=1&episode=1',
            { headers: JSON_HDRS, signal: AbortSignal.timeout(10000) }
          ).then(r => r.json())
          imdbId  = t?.data?.imdb_id || null
          seasons = Array.isArray(t?.data?.season) ? t.data.season : [1]
        }
      }

      return NextResponse.json({ data: { isTV, imdbId, seasons } })
    } catch (e) {
      console.error('[movies:play]', e.message)
      return NextResponse.json({ error: 'Movie playback information is temporarily unavailable. Try again shortly.' }, { status: 502 })
    }
  }

  /* ── Standard xcasper API actions ── */
  try {
    switch (action) {
      case 'trending':  return NextResponse.json(brandPublicResponse(await xc('/api/trending')))
      case 'hot':       return NextResponse.json(brandPublicResponse(await xc('/api/hot')))
      case 'search':    return NextResponse.json(brandPublicResponse(await xc('/api/search?keyword=' + encodeURIComponent(q) + (type ? '&type=' + type : ''))))
      case 'detail':    return NextResponse.json(brandPublicResponse(await xc('/api/rich-detail?subjectId=' + encodeURIComponent(id))))
      case 'recommend': return NextResponse.json(brandPublicResponse(await xc('/api/recommend?subjectId=' + encodeURIComponent(id) + '&page=1&perPage=12')))
      default:          return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
    } catch (e) {
    console.error('[movies]', e.message)
    return NextResponse.json({ error: 'Movies service is temporarily unavailable. Try again shortly.' }, { status: 502 })
  }
}
