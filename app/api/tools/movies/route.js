import { NextResponse } from 'next/server'
import { brandPublicResponse } from '../../../../lib/brandPublicResponse'

const DAVEX_BASE = 'https://davexmovieapi.zone.id'
const LEGACY_BASE = 'https://movieapi.xcasper.space'
const LEGACY_SITE = 'https://xcasper.space'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

const DAVE_JSON_HEADERS = {
  'User-Agent': UA,
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
}

const LEGACY_BROWSER_HEADERS = {
  'User-Agent': UA,
  'Referer': LEGACY_SITE + '/',
  'Origin': LEGACY_SITE,
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'identity',
  'Connection': 'keep-alive',
  'Sec-Fetch-Dest': 'video',
  'Sec-Fetch-Mode': 'no-cors',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="122", "Google Chrome";v="122"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
}

const LEGACY_JSON_HEADERS = {
  ...LEGACY_BROWSER_HEADERS,
  Accept: 'application/json',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
}

function asNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function normalizeMovie(raw = {}) {
  const cover = raw?.cover?.url || raw?.poster_url || raw?.poster || raw?.cover || ''
  const genre = Array.isArray(raw?.genre) ? raw.genre.join(', ') : (raw?.genre || '')
  const subjectType = asNumber(raw?.subject_type ?? raw?.subjectType ?? raw?.type, 1)

  return {
    subjectId: String(raw?.subject_id ?? raw?.subjectId ?? raw?.id ?? ''),
    subjectType: subjectType === 2 ? 2 : 1,
    title: raw?.title || raw?.name || 'Untitled',
    description: raw?.description || '',
    releaseDate: raw?.release_date || raw?.releaseDate || (raw?.year ? String(raw.year) : ''),
    duration: raw?.duration_seconds ?? raw?.duration ?? '',
    genre,
    cover,
    countryName: raw?.country_name || raw?.countryName || raw?.country || '',
    imdbRatingValue: raw?.imdb_rating_value ?? raw?.imdb_rating ?? raw?.imdbRatingValue ?? '',
    hasResource: raw?.has_resource ?? raw?.hasResource ?? true,
  }
}

function pickCollection(payload) {
  const root = payload?.data ?? payload ?? {}
  const direct = [root?.results, root?.items, root?.subjectList, root?.list]
    .find(value => Array.isArray(value))
  if (direct) return direct

  if (Array.isArray(root?.sections)) {
    return root.sections.flatMap(section => Array.isArray(section?.items) ? section.items : [])
  }

  return []
}

function normalizeCollection(payload) {
  return pickCollection(payload)
    .map(normalizeMovie)
    .filter(movie => movie.subjectId && movie.title)
}

function listResponse(list, extra = {}) {
  return brandPublicResponse({
    success: true,
    api: 'Toosii API',
    ...extra,
    data: { subjectList: list, items: list },
  })
}

function detailResponse(movie, extra = {}) {
  return brandPublicResponse({
    success: true,
    api: 'Toosii API',
    ...extra,
    data: movie,
  })
}

async function daveJson(path) {
  const response = await fetch(DAVEX_BASE + path, {
    headers: DAVE_JSON_HEADERS,
    signal: AbortSignal.timeout(12000),
  })
  if (!response.ok) throw new Error('Dave service ' + response.status + ': ' + path)
  return response.json()
}

async function legacyJson(path) {
  const response = await fetch(LEGACY_BASE + path, {
    headers: LEGACY_JSON_HEADERS,
    signal: AbortSignal.timeout(12000),
  })
  if (!response.ok) throw new Error('Legacy service ' + response.status + ': ' + path)
  return response.json()
}

function daveType(type) {
  if (type === '1') return 'MOVIE'
  if (type === '2') return 'TV_SERIES'
  return 'ALL'
}

function daveStreamUrl(id, res, season, episode) {
  const params = new URLSearchParams({ resolution: String(res || 720) })
  if (season && episode) {
    params.set('season', String(season))
    params.set('episode', String(episode))
  }
  return DAVEX_BASE + '/bff/stream/' + encodeURIComponent(id) + '?' + params.toString()
}

function daveDownloadUrl(id, res, season, episode, title = 'movie') {
  const params = new URLSearchParams({
    subjectId: String(id),
    resolution: String(res || 720),
    filename: String(title || 'movie').replace(/[^a-z0-9._ -]/gi, '').trim() || 'movie',
  })
  if (season && episode) {
    params.set('season', String(season))
    params.set('episode', String(episode))
  }
  return DAVEX_BASE + '/proxy/download?' + params.toString()
}

function legacyStreamUrl(id, res, season, episode) {
  let url = LEGACY_BASE + '/api/bff/stream?subjectId=' + encodeURIComponent(id) + '&resolution=' + encodeURIComponent(res || 720)
  if (season && episode) url += '&se=' + encodeURIComponent(season) + '&ep=' + encodeURIComponent(episode)
  return url
}

function filenameFor(title, res, season, episode) {
  const clean = String(title || 'movie').replace(/[^a-z0-9._ -]/gi, '').trim() || 'movie'
  const position = season && episode ? '-S' + season + 'E' + episode : ''
  return clean + position + '-' + (res || 720) + 'p.mp4'
}

function mediaResponse(upstream, { download = false, filename = 'movie.mp4' } = {}) {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': download ? 'no-store' : 'public, max-age=900',
  })

  for (const header of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
    const value = upstream.headers.get(header)
    if (value) headers.set(header, value)
  }

  if (download) {
    headers.set('Content-Disposition', upstream.headers.get('content-disposition') || 'attachment; filename="' + filename + '"')
  }

  return new Response(upstream.body, { status: upstream.status, headers })
}

async function fetchMedia(url, request, { download = false, timeout = 60000, filename = 'movie.mp4', headers = {} } = {}) {
  const range = request.headers.get('range') || ''
  const upstream = await fetch(url, {
    headers: {
      ...headers,
      Accept: 'video/mp4,video/webm,video/*,application/octet-stream,*/*;q=0.9',
      ...(range ? { Range: range } : {}),
    },
    signal: AbortSignal.timeout(timeout),
  })

  if (!upstream.ok) throw new Error('media ' + upstream.status)
  const contentType = upstream.headers.get('content-type') || ''
  if (!contentType.includes('video') && !contentType.includes('octet-stream') && !contentType.includes('mp4')) {
    throw new Error('not-media')
  }
  return mediaResponse(upstream, { download, filename })
}

async function legacyPlay(id) {
  const detail = await legacyJson('/api/rich-detail?subjectId=' + encodeURIComponent(id))
  const data = detail?.data || {}
  const isTV = (data.subjectType || 1) === 2
  const title = (data.title || '').replace(/\s*S\d.*/i, '').trim()
  const sbType = isTV ? 'tv' : 'movie'
  const search = await fetch(
    LEGACY_BASE + '/api/showbox/search?keyword=' + encodeURIComponent(title) + '&type=' + sbType,
    { headers: LEGACY_JSON_HEADERS, signal: AbortSignal.timeout(10000) }
  ).then(response => response.json())
  const item = search?.data?.[0]
  let imdbId = null
  let seasons = []

  if (item) {
    if (!isTV) {
      const movie = await legacyJson('/api/showbox/movie?id=' + encodeURIComponent(item.id))
      imdbId = movie?.data?.imdb_id || null
    } else {
      const tv = await legacyJson('/api/showbox/tv?id=' + encodeURIComponent(item.id) + '&season=1&episode=1')
      imdbId = tv?.data?.imdb_id || null
      seasons = Array.isArray(tv?.data?.season) ? tv.data.season.map(asNumber).filter(Boolean) : [1]
    }
  }

  return { isTV, imdbId, seasons }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') || 'trending'
  const id = searchParams.get('id') || ''
  const q = searchParams.get('q') || ''
  const type = searchParams.get('type') || ''
  const res = searchParams.get('res') || searchParams.get('resolution') || '720'
  const season = searchParams.get('se') || searchParams.get('season') || ''
  const episode = searchParams.get('ep') || searchParams.get('episode') || ''
  const title = searchParams.get('title') || 'movie'

  if (action === 'stream' || action === 'download' || action === 'legacy-download') {
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const filename = filenameFor(title, res, season, episode)

    if (action === 'legacy-download') {
      try {
        return await fetchMedia(legacyStreamUrl(id, res, season, episode), req, {
          download: true,
          filename,
          headers: LEGACY_BROWSER_HEADERS,
        })
      } catch (error) {
        console.error('[movies:legacy-download]', error.message)
        return NextResponse.json({ error: 'Fallback download is temporarily unavailable.' }, { status: 502 })
      }
    }

    const isDownload = action === 'download'
    try {
      const mediaUrl = isDownload
        ? daveDownloadUrl(id, res, season, episode, title)
        : daveStreamUrl(id, res, season, episode)
      return await fetchMedia(mediaUrl, req, {
        download: isDownload,
        filename,
        headers: DAVE_JSON_HEADERS,
      })
    } catch (error) {
      console.error('[movies:dave-media]', error.message)
      try {
        return await fetchMedia(legacyStreamUrl(id, res, season, episode), req, {
          download: isDownload,
          filename,
          headers: LEGACY_BROWSER_HEADERS,
        })
      } catch (fallbackError) {
        console.error('[movies:legacy-media]', fallbackError.message)
        return NextResponse.json({ error: isDownload ? 'Movie download is temporarily unavailable. Try again shortly.' : 'Movie stream is temporarily unavailable. Try another server or try again shortly.' }, { status: 502 })
      }
    }
  }

  if (action === 'play') {
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    try {
      const detail = await daveJson('/item/' + encodeURIComponent(id))
      const movie = normalizeMovie(detail)
      const isTV = movie.subjectType === 2
      let seasons = []
      let seasonDetails = []

      if (isTV) {
        const seasonPayload = await daveJson('/item/' + encodeURIComponent(id) + '/seasons')
        seasonDetails = (seasonPayload?.seasons || [])
          .map(item => {
            const number = asNumber(item?.season_number ?? item?.season)
            const maxEpisodes = asNumber(item?.max_episodes ?? item?.episode_count ?? item?.episodeCount)
            const resolutionEpisodes = Array.isArray(item?.resolutions)
              ? Math.max(...item.resolutions.map(resolution => asNumber(resolution?.ep_num)).filter(Boolean), 0)
              : 0
            const available = String(item?.available_episodes || '')
              .split(/[,|\s]+/)
              .map(asNumber)
              .filter(Boolean)
            const count = Math.max(maxEpisodes, resolutionEpisodes, available.length ? Math.max(...available) : 0)
            return number ? { number, episodes: available.length ? available : Array.from({ length: count }, (_, index) => index + 1) } : null
          })
          .filter(Boolean)
        seasons = seasonDetails.map(item => item.number)
      }

      return NextResponse.json(brandPublicResponse({
        success: true,
        api: 'Toosii API',
        data: { isTV, imdbId: detail?.imdb_id || detail?.imdbId || null, seasons, seasonDetails },
      }))
    } catch (error) {
      console.error('[movies:dave-play]', error.message)
      try {
        return NextResponse.json({ success: true, api: 'Toosii API', data: { ...(await legacyPlay(id)), seasonDetails: [] } })
      } catch (fallbackError) {
        console.error('[movies:legacy-play]', fallbackError.message)
        return NextResponse.json({ error: 'Movie playback information is temporarily unavailable. Try again shortly.' }, { status: 502 })
      }
    }
  }

  try {
    if (action === 'trending') {
      try {
        return NextResponse.json(listResponse(normalizeCollection(await daveJson('/trending?tab=0&page=1')), { operation: 'movies.trending' }))
      } catch (error) {
        console.error('[movies:dave-trending]', error.message)
        const legacy = await legacyJson('/api/trending')
        return NextResponse.json(listResponse((legacy?.data?.subjectList || []).map(normalizeMovie), { operation: 'movies.trending' }))
      }
    }

    if (action === 'hot') {
      try {
        return NextResponse.json(listResponse(normalizeCollection(await daveJson('/hot?page=1')), { operation: 'movies.hot' }))
      } catch (error) {
        console.error('[movies:dave-hot]', error.message)
        const legacy = await legacyJson('/api/hot')
        return NextResponse.json(listResponse((legacy?.data?.subjectList || []).map(normalizeMovie), { operation: 'movies.hot' }))
      }
    }

    if (action === 'search') {
      if (!q.trim()) return NextResponse.json(listResponse([], { operation: 'movies.search' }))
      try {
        const path = '/search?q=' + encodeURIComponent(q) + '&type=' + daveType(type) + '&page=1&per_page=20'
        return NextResponse.json(listResponse(normalizeCollection(await daveJson(path)), { operation: 'movies.search' }))
      } catch (error) {
        console.error('[movies:dave-search]', error.message)
        const legacy = await legacyJson('/api/search?keyword=' + encodeURIComponent(q) + (type ? '&type=' + encodeURIComponent(type) : ''))
        return NextResponse.json(listResponse((legacy?.data?.items || legacy?.data?.subjectList || []).map(normalizeMovie), { operation: 'movies.search' }))
      }
    }

    if (action === 'detail') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      try {
        return NextResponse.json(detailResponse(normalizeMovie(await daveJson('/item/' + encodeURIComponent(id))), { operation: 'movies.detail' }))
      } catch (error) {
        console.error('[movies:dave-detail]', error.message)
        return NextResponse.json(detailResponse(normalizeMovie((await legacyJson('/api/rich-detail?subjectId=' + encodeURIComponent(id)))?.data), { operation: 'movies.detail' }))
      }
    }

    if (action === 'recommend') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      try {
        const detail = normalizeMovie(await daveJson('/item/' + encodeURIComponent(id)))
        const path = detail.subjectType === 2
          ? '/tv/recommend/' + encodeURIComponent(id) + '?limit=12'
          : '/movie/recommend/' + encodeURIComponent(id) + '?limit=12'
        return NextResponse.json(listResponse(normalizeCollection(await daveJson(path)), { operation: 'movies.recommend' }))
      } catch (error) {
        console.error('[movies:dave-recommend]', error.message)
        const legacy = await legacyJson('/api/recommend?subjectId=' + encodeURIComponent(id) + '&page=1&perPage=12')
        return NextResponse.json(listResponse((legacy?.data?.subjectList || legacy?.data?.items || []).map(normalizeMovie), { operation: 'movies.recommend' }))
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('[movies]', error.message)
    return NextResponse.json({ error: 'Movies service is temporarily unavailable. Try again shortly.' }, { status: 502 })
  }
}
