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

/* Extract a trailer URL from detail data */
function getTrailerUrl(d) {
  if (!d) return { directUrl: null, ytId: null }
  const urlFields = [
    d.trailerList?.[0]?.url,
    d.trailerList?.[0]?.videoUrl,
    d.trailer?.url,
    d.trailer?.videoUrl,
    d.trailerUrl,
  ]
  const directUrl = urlFields.find(u => u && typeof u === 'string' && u.startsWith('http')) || null

  const ytFields = [
    d.trailerId, d.youtubeTrailerId, d.ytTrailerId,
    d.trailerList?.[0]?.youtubeId, d.trailerList?.[0]?.id,
    d.trailer?.youtubeId, d.trailer?.id,
  ]
  const ytId = ytFields.find(v => v && typeof v === 'string') || null

  return { directUrl, ytId }
}

/* Search ShowBox and return best matching item */
async function showboxSearch(title, type) {
  const clean = title.replace(/\s*S\d.*$/i, '').trim()
  const url = `${BASE}/api/showbox/search?keyword=${encodeURIComponent(clean)}&type=${type}`
  const res = await fetch(url, { headers: HDRS, signal: AbortSignal.timeout(12000) })
  const data = await res.json()
  return data?.data?.[0] || null
}

/* Parse ShowBox quality string → numeric resolution */
function parseQuality(q) {
  if (!q) return 0
  if (q === '4K' || q === '2160p') return 2160
  const n = parseInt(q)
  return isNaN(n) || n <= 0 ? 0 : n
}

/* Get ShowBox movie files — includes free AND VIP entries (VIP shown as locked in UI) */
async function showboxMovieFiles(sbId) {
  const res  = await fetch(`${BASE}/api/showbox/movie?id=${sbId}`, { headers: HDRS, signal: AbortSignal.timeout(12000) })
  const data = await res.json()
  const files = (data?.data?.file || []).filter(f => parseQuality(f.quality) > 0)
  /* Deduplicate by resolution — prefer free file over VIP, then highest count */
  const best = {}
  for (const f of files) {
    const q   = parseQuality(f.quality)
    const cur = best[q]
    if (!cur) { best[q] = f; continue }
    /* Free beats VIP; same vip status → higher count wins */
    const fFree   = !f.vip_only && f.path?.startsWith('http')
    const curFree = !cur.vip_only && cur.path?.startsWith('http')
    if (fFree && !curFree) { best[q] = f; continue }
    if (!fFree && curFree) continue
    if ((f.count || 0) > (cur.count || 0)) best[q] = f
  }
  return Object.values(best)
    .map(f => {
      const q    = parseQuality(f.quality)
      const free = !f.vip_only && f.path?.startsWith('http')
      return {
        resolutions: q,
        url:         free ? f.path : '',
        proxyUrl:    free ? f.path : '',
        size:        f.size || '',
        quality:     f.quality,
        vip_only:    free ? 0 : 1,
      }
    })
    .filter(s => s.resolutions > 0)
    .sort((a, b) => b.resolutions - a.resolutions)
}

/* Get ShowBox TV season list */
async function showboxTvSeasons(sbId) {
  const res     = await fetch(`${BASE}/api/showbox/tv?id=${sbId}&season=1&episode=1`, { headers: HDRS, signal: AbortSignal.timeout(12000) })
  const data    = await res.json()
  const tv      = data?.data || {}
  /* xcasper/ShowBox stores the IMDB ID on the TV object */
  const imdbId     = tv.imdb_id || null
  const seasonNums = Array.isArray(tv.season) ? tv.season : [1]
  const seasons    = seasonNums.map(n => ({ season: n, episodes: tv.max_episode || 50 }))
  return { seasons, imdbId }
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

  /* ── Full movie download proxy ── */
  if (action === 'download') {
    try {
      if (!id || !res) return NextResponse.json({ error: 'Missing id or res' }, { status: 400 })

      const se = searchParams.get('se') || ''
      const ep = searchParams.get('ep') || ''

      /* Try xcasper /api/play first */
      let dlUrl = null
      try {
        const data    = await up(`${BASE}/api/play?subjectId=${encodeURIComponent(id)}`)
        const streams = data?.data?.streams || []
        const stream  = streams.find(s => String(s.resolutions) === String(res)) || streams[0]
        if (stream) {
          dlUrl = stream.downloadUrl || stream.url
          if (se && ep && dlUrl) {
            dlUrl = dlUrl.replace(/se=\d+/, 'se=' + se).replace(/ep=\d+/, 'ep=' + ep)
          }
        }
      } catch {}

      /* ShowBox fallback for movies */
      if (!dlUrl) {
        try {
          const detail = await up(`${BASE}/api/rich-detail?subjectId=${encodeURIComponent(id)}`)
          const mvTitle = detail?.data?.title || title
          const isTV = (detail?.data?.subjectType || 1) === 2
          if (!isTV) {
            const sbItem = await showboxSearch(mvTitle, 'movie')
            if (sbItem) {
              const files = await showboxMovieFiles(sbItem.id)
              /* Only consider free (non-VIP) files with a real URL */
              const free  = files.filter(f => !f.vip_only && f.url)
              const match = free.find(f => String(f.resolutions) === String(res)) || free[0]
              if (match) dlUrl = match.url
            }
          }
        } catch {}
      }

      if (!dlUrl) return NextResponse.json({ error: 'Stream not available for this title' }, { status: 404 })

      const vidRes = await fetch(dlUrl, {
        headers: { 'User-Agent': HDRS['User-Agent'], 'Referer': HDRS['Referer'] },
        signal: AbortSignal.timeout(30000),
      })

      if (!vidRes.ok) return NextResponse.json({ error: 'CDN unavailable' }, { status: 502 })

      const safe     = title.replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/\s+/g, '_') || 'movie'
      const epSuffix = (se && ep) ? `_S${se}_E${ep}` : ''
      const resLabel = Number(res) >= 2160 ? '4K' : `${res}p`
      const filename = `${safe}${epSuffix}_${resLabel}.mp4`

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

  /* ── Play / stream URLs with ShowBox fallback ── */
  if (action === 'play') {
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    /* Try xcasper primary endpoint first */
    try {
      const data = await up(`${BASE}/api/play?subjectId=${encodeURIComponent(id)}`)
      if (data?.data?.streams?.length) {
        return NextResponse.json(data)
      }
    } catch {}

    /* Fallback: ShowBox */
    try {
      const detail = await up(`${BASE}/api/rich-detail?subjectId=${encodeURIComponent(id)}`)
      const mvTitle = detail?.data?.title || ''
      const isTV    = (detail?.data?.subjectType || 1) === 2

      const sbType  = isTV ? 'tv' : 'movie'
      const sbItem  = await showboxSearch(mvTitle, sbType)

      if (!sbItem) {
        return NextResponse.json({ data: { streams: [], seasons: [], isShowbox: true } })
      }

      const sbId = sbItem.id

      if (isTV) {
        /* For TV: return season list + IMDB ID (from xcasper/ShowBox); client uses VidSrc embed */
        const { seasons, imdbId: sbImdbId } = await showboxTvSeasons(sbId)
        /* Return dummy stream objects so the UI knows it's a TV show with episodes */
        const streams = [{ resolutions: 0, url: '', proxyUrl: '', isEmbed: true }]
        return NextResponse.json({ data: { streams, seasons, showboxId: sbId, isShowbox: true, isTV: true, imdbId: sbImdbId } })
      } else {
        /* For movies: return free direct file URLs */
        const streams = await showboxMovieFiles(sbId)
        if (!streams.length) {
          return NextResponse.json({ data: { streams: [], seasons: [], isShowbox: true, noFreeStream: true } })
        }
        return NextResponse.json({ data: { streams, seasons: [], showboxId: sbId, isShowbox: true } })
      }
    } catch (e) {
      console.error('[movies:play:showbox]', e.message)
      return NextResponse.json({ data: { streams: [], seasons: [] } })
    }
  }

  /* ── Trailer download proxy ── */
  if (action === 'trailer-dl') {
    try {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

      const detailData = await up(`${BASE}/api/rich-detail?subjectId=${encodeURIComponent(id)}`)
      const { directUrl, ytId } = getTrailerUrl(detailData?.data || null)

      if (directUrl) {
        /* Stream direct MP4 trailer as attachment */
        const vidRes = await fetch(directUrl, {
          headers: { 'User-Agent': HDRS['User-Agent'], 'Referer': HDRS['Referer'] },
          signal: AbortSignal.timeout(30000),
        })
        if (!vidRes.ok) return NextResponse.json({ error: 'Trailer CDN unavailable' }, { status: 502 })

        const safe     = title.replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/\s+/g, '_') || 'trailer'
        const filename = `${safe}_trailer.mp4`

        const outHeaders = new Headers()
        outHeaders.set('Content-Type',        vidRes.headers.get('content-type') || 'video/mp4')
        outHeaders.set('Content-Disposition', `attachment; filename="${filename}"`)
        outHeaders.set('Cache-Control',       'no-store')
        const cl = vidRes.headers.get('content-length')
        if (cl) outHeaders.set('Content-Length', cl)

        return new Response(vidRes.body, { status: 200, headers: outHeaders })
      }

      if (ytId) {
        /* Redirect to YouTube watch page when only YouTube ID available */
        return Response.redirect(`https://www.youtube.com/watch?v=${ytId}`, 302)
      }

      return NextResponse.json({ error: 'No trailer available for download' }, { status: 404 })
    } catch (e) {
      console.error('[movies:trailer-dl]', e.message)
      return NextResponse.json({ error: 'Trailer download failed.' }, { status: 500 })
    }
  }

  /* ── YouTube trailer download at specific quality ── */
  if (action === 'trailer-dl-yt') {
    const ytId    = searchParams.get('ytId')     || ''
    const quality = searchParams.get('quality')  || '720'

    if (!ytId) return NextResponse.json({ error: 'Missing ytId' }, { status: 400 })

    try {
      const { ytdlpGetUrl } = await import('../../../../lib/ytdlp.js')
      const ytUrl = `https://www.youtube.com/watch?v=${ytId}`

      const fmtMap = {
        '360':  'best[height<=360][ext=mp4]/best[height<=360]',
        '480':  'best[height<=480][ext=mp4]/best[height<=480]',
        '720':  'best[height<=720][ext=mp4]/best[height<=720]',
        '1080': 'best[height<=1080][ext=mp4]/best[height<=1080]',
      }
      const fmt = fmtMap[quality] || fmtMap['720']

      const dlUrl = await ytdlpGetUrl(ytUrl, fmt)
      if (!dlUrl) return NextResponse.json({ error: 'Quality not available' }, { status: 404 })

      const vidRes = await fetch(dlUrl, {
        headers: { 'User-Agent': HDRS['User-Agent'], 'Referer': 'https://www.youtube.com/' },
        signal: AbortSignal.timeout(30000),
      })
      if (!vidRes.ok) return NextResponse.json({ error: 'CDN unavailable' }, { status: 502 })

      const safe     = title.replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/\s+/g, '_') || 'trailer'
      const filename = `${safe}_trailer_${quality}p.mp4`

      const outHeaders = new Headers()
      outHeaders.set('Content-Type',        vidRes.headers.get('content-type') || 'video/mp4')
      outHeaders.set('Content-Disposition', `attachment; filename="${filename}"`)
      outHeaders.set('Cache-Control',       'no-store')
      const cl = vidRes.headers.get('content-length')
      if (cl) outHeaders.set('Content-Length', cl)

      return new Response(vidRes.body, { status: 200, headers: outHeaders })
    } catch (e) {
      console.error('[movies:trailer-dl-yt]', e.message)
      return NextResponse.json({ error: 'YouTube trailer download failed. Try again.' }, { status: 500 })
    }
  }

  /* ── Regular actions ── */
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
        case 'recommend':
          url = `${BASE}/api/recommend?subjectId=${encodeURIComponent(id)}&page=1&perPage=12`
          break
        case 'episodes':
          url = `${BASE}/api/episodes?subjectId=${encodeURIComponent(id)}`
          break
        case 'play-ep':
          url = `${BASE}/api/play?episodeId=${encodeURIComponent(id)}`
          break
        case 'tvmaze': {
          try {
            const tvSearch = await fetch('https://api.tvmaze.com/search/shows?q=' + encodeURIComponent(q),
              { headers: { 'User-Agent': 'ToosiiTech/1.0' } })
            const tvShows  = await tvSearch.json()
            if (!tvShows?.length) return NextResponse.json({ episodes: [], imdbId: null })
            const tvId   = tvShows[0].show.id
            const imdbId = tvShows[0].show?.externals?.imdb || null
            const tvEps  = await fetch('https://api.tvmaze.com/shows/' + tvId + '/episodes',
              { headers: { 'User-Agent': 'ToosiiTech/1.0' } })
            const epList   = await tvEps.json()
            /* Also compute per-season episode counts */
            const seasonCounts = {}
            const episodes = Array.isArray(epList)
              ? epList.map(e => {
                  seasonCounts[e.season] = (seasonCounts[e.season] || 0) + 1
                  return { season: e.season, number: e.number, name: e.name }
                })
              : []
            return NextResponse.json({ episodes, imdbId, seasonCounts })
          } catch {
            return NextResponse.json({ episodes: [], imdbId: null, seasonCounts: {} })
          }
        }
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
