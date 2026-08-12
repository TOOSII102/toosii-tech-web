import { NextResponse } from 'next/server'
import { fetchWithWebshare, webshareEnabled } from '../../../../lib/webshareProxy'

export const runtime = 'nodejs'

const BASE = 'https://movieapi.xcasper.space'
const SITE = 'https://xcasper.space'
const TVMAZE = 'https://api.tvmaze.com'
const ALL_IN_ONE = 'https://allinoneapi.vercel.app'

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

async function upstreamFetch(url, init = {}) {
  if (webshareEnabled()) return fetchWithWebshare(url, init)
  return fetch(url, init)
}

async function xc(path) {
  const r = await upstreamFetch(BASE + path, { headers: JSON_HDRS, signal: AbortSignal.timeout(12000) })
  if (!r.ok) throw new Error('xcasper ' + r.status + ': ' + path)
  return r.json()
}

function xcStreamUrl(id, res, se, ep) {
  let url = BASE + '/api/bff/stream?subjectId=' + encodeURIComponent(id) + '&resolution=' + res
  if (se && ep) url += '&se=' + se + '&ep=' + ep
  return url
}

function plainText(value = '') {
  return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function comparableTitle(value = '') {
  return plainText(value)
    .replace(/\s*S\d+(?:\s*-\s*S?\d+)?\b.*$/i, '')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase()
}

function bestTitleMatch(items, title, getTitle) {
  const target = comparableTitle(title)
  if (!target || !Array.isArray(items)) return null
  let best = null
  let bestScore = 0
  for (const item of items) {
    const candidate = comparableTitle(getTitle(item))
    if (!candidate) continue
    const score = candidate === target ? 3 : (candidate.includes(target) || target.includes(candidate) ? 2 : 0)
    if (score > bestScore) { best = item; bestScore = score }
  }
  return bestScore ? best : null
}

async function publicJson(url, timeout = 8000) {
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeout),
      next: { revalidate: 3600 },
    })
    return response.ok ? response.json() : null
  } catch {
    return null
  }
}

function allInOneMeta(item, isTV) {
  if (!item) return null
  return {
    provider: 'allinone',
    title: item.title || '',
    summary: item.description || '',
    poster: item.img || '',
    rating: item.rate || null,
    genres: Array.isArray(item.genre) ? item.genre : [],
    year: isTV ? item.started : item.year,
    endYear: isTV ? item.ended : null,
    seasons: isTV && Number.isFinite(item.seasons) ? Array.from({ length: item.seasons }, (_, index) => index + 1) : [],
    totalEpisodes: isTV && Number.isFinite(item.episodes) ? item.episodes : null,
  }
}

async function supplementalMetadata(title, isTV) {
  const cataloguePath = isTV ? '/series' : '/movies'
  const [catalogue, showSearch] = await Promise.all([
    publicJson(ALL_IN_ONE + cataloguePath),
    isTV ? publicJson(TVMAZE + '/search/shows?q=' + encodeURIComponent(title)) : Promise.resolve(null),
  ])

  const catalogueMatch = bestTitleMatch(catalogue, title, item => item.title)
  const catalogueMeta = allInOneMeta(catalogueMatch, isTV)
  if (!isTV) return catalogueMeta

  const showMatch = bestTitleMatch(showSearch, title, item => item?.show?.name)
  const show = showMatch?.show
  if (!show) return catalogueMeta

  const episodes = await publicJson(TVMAZE + '/shows/' + show.id + '/episodes')
  const episodeCounts = {}
  for (const episode of Array.isArray(episodes) ? episodes : []) {
    if (episode?.season > 0) episodeCounts[episode.season] = (episodeCounts[episode.season] || 0) + 1
  }
  const seasons = Object.keys(episodeCounts).map(Number).sort((a, b) => a - b)

  return {
    provider: 'tvmaze',
    title: show.name || title,
    summary: plainText(show.summary || catalogueMeta?.summary || ''),
    poster: show.image?.original || show.image?.medium || catalogueMeta?.poster || '',
    rating: show.rating?.average || catalogueMeta?.rating || null,
    genres: show.genres?.length ? show.genres : (catalogueMeta?.genres || []),
    year: show.premiered?.slice(0, 4) || catalogueMeta?.year || '',
    endYear: show.ended?.slice(0, 4) || catalogueMeta?.endYear || '',
    imdbId: show.externals?.imdb || null,
    status: show.status || '',
    seasons,
    episodeCounts,
    totalEpisodes: Array.isArray(episodes) ? episodes.length : (catalogueMeta?.totalEpisodes || null),
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') || 'trending'
  const id     = searchParams.get('id')     || ''
  const q      = searchParams.get('q')      || ''
  const type   = searchParams.get('type')   || ''
  const kind   = searchParams.get('kind')   || ''
  const res    = searchParams.get('res')    || '720'
  const se     = searchParams.get('se')     || ''
  const ep     = searchParams.get('ep')     || ''

  /* ── Stream proxy: full browser headers + Range forwarding ── */
  if (action === 'stream') {
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const url   = xcStreamUrl(id, res, se, ep)
    const range = req.headers.get('range') || ''
    try {
      const upstream = await upstreamFetch(url, {
        headers: {
          ...BROWSER_HDRS,
          'Accept': 'video/mp4,video/webm,video/*,*/*;q=0.9',
          ...(range ? { Range: range } : {}),
        },
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
      return NextResponse.json({ error: e.message }, { status: 502 })
    }
  }

  /* ── Download: probe/range support + native browser download handoff ── */
  if (action === 'download') {
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const url = xcStreamUrl(id, res, se, ep)
    const range = req.headers.get('range') || ''
    try {
      const upstream = await upstreamFetch(url, {
        headers: {
          ...BROWSER_HDRS,
          'Accept': 'video/mp4,video/webm,video/*,*/*;q=0.9',
          ...(range ? { Range: range } : {}),
        },
        signal: AbortSignal.timeout(60000),
      })
      if (!upstream.ok) {
        return NextResponse.json(
          { error: 'The clean download source is unavailable for this title. Try streaming or select a manual backup to watch.' },
          { status: 502 }
        )
      }
      const ct = upstream.headers.get('content-type') || ''
      if (!ct.includes('video') && !ct.includes('octet-stream') && !ct.includes('mp4')) {
        return NextResponse.json(
          { error: 'The source did not return a downloadable video file.' },
          { status: 502 }
        )
      }
      const out = new Headers({
        'Content-Disposition': 'attachment; filename="movie-' + res + 'p.mp4"',
        'Content-Type':        ct || 'video/mp4',
        'Cache-Control':       'no-store',
        'Accept-Ranges':       'bytes',
      })
      for (const header of ['content-length', 'content-range']) {
        const value = upstream.headers.get(header)
        if (value) out.set(header, value)
      }
      return new Response(upstream.body, { status: upstream.status, headers: out })
    } catch {
      return NextResponse.json(
        { error: 'The clean download source did not respond. Please try again later.' },
        { status: 502 }
      )
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

      const sbSearch = await upstreamFetch(
        BASE + '/api/showbox/search?keyword=' + encodeURIComponent(title) + '&type=' + sbType,
        { headers: JSON_HDRS, signal: AbortSignal.timeout(10000) }
      ).then(r => r.json())

      const sbItem = sbSearch?.data?.[0]
      let imdbId = null, seasons = []

      if (sbItem) {
        if (!isTV) {
          const m = await upstreamFetch(
            BASE + '/api/showbox/movie?id=' + sbItem.id,
            { headers: JSON_HDRS, signal: AbortSignal.timeout(10000) }
          ).then(r => r.json())
          imdbId = m?.data?.imdb_id || null
        } else {
          const t = await upstreamFetch(
            BASE + '/api/showbox/tv?id=' + sbItem.id + '&season=1&episode=1',
            { headers: JSON_HDRS, signal: AbortSignal.timeout(10000) }
          ).then(r => r.json())
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
      case 'metadata':  return NextResponse.json({ data: await supplementalMetadata(q, kind === 'tv') })
      default:          return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 502 })
  }
}
