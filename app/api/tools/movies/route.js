import { NextResponse } from 'next/server'
import { brandPublicResponse } from '../../../../lib/brandPublicResponse'

const DAVEX_BASE = 'https://davexmovieapi.zone.id'
const LEGACY_BASE = 'https://movieapi.xcasper.space'
const LEGACY_SITE = 'https://xcasper.space'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36'

const DAVE_JSON_HEADERS = {
  'User-Agent': UA,
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
}

const LEGACY_BROWSER_HEADERS = {
  'User-Agent': UA,
  Referer: LEGACY_SITE + '/',
  Origin: LEGACY_SITE,
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'identity',
  Connection: 'keep-alive',
  'Sec-Fetch-Dest': 'video',
  'Sec-Fetch-Mode': 'no-cors',
  'Sec-Fetch-Site': 'same-origin',
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

function unwrap(payload) {
  return payload?.data ?? payload ?? {}
}

function firstText(...values) {
  return values.find(value => value !== undefined && value !== null && String(value).trim() !== '') || ''
}

function normalizeMovie(raw = {}) {
  const cover = firstText(raw?.cover?.url, raw?.cover?.source_url, raw?.poster_url, raw?.poster, raw?.cover)
  const genre = Array.isArray(raw?.genre) ? raw.genre.join(', ') : firstText(raw?.genre, raw?.genres)
  const subjectType = asNumber(raw?.subject_type ?? raw?.subjectType ?? raw?.type, 1)
  return {
    subjectId: String(raw?.subject_id ?? raw?.subjectId ?? raw?.id ?? ''),
    subjectType: subjectType === 2 ? 2 : 1,
    title: firstText(raw?.title, raw?.name, raw?.post_title, 'Untitled'),
    description: firstText(raw?.description, raw?.plot, ''),
    releaseDate: firstText(raw?.release_date, raw?.releaseDate, raw?.year ? String(raw.year) : ''),
    duration: raw?.duration_seconds ?? raw?.duration ?? '',
    genre,
    cover,
    countryName: firstText(raw?.country_name, raw?.countryName, raw?.country),
    imdbRatingValue: raw?.imdb_rating_value ?? raw?.imdb_rating ?? raw?.imdbRatingValue ?? '',
    language: Array.isArray(raw?.language) ? raw.language : [],
    contentRating: firstText(raw?.content_rating, raw?.contentRating),
    hasResource: raw?.has_resource ?? raw?.hasResource ?? true,
  }
}

function pickCollection(payload) {
  const root = unwrap(payload)
  const direct = [root?.results, root?.items, root?.subjectList, root?.list]
    .find(value => Array.isArray(value))
  if (direct) return direct
  if (Array.isArray(root)) return root
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

function normalizeLegacyCollection(payload) {
  return (payload?.data?.subjectList || payload?.data?.items || payload?.data?.results || [])
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
  return brandPublicResponse({ success: true, api: 'Toosii API', ...extra, data: movie })
}

function daveType(type) {
  if (type === '1') return 'MOVIE'
  if (type === '2') return 'TV_SERIES'
  return 'ALL'
}

function safeFilename(title, res, season, episode) {
  const clean = String(title || 'movie').replace(/[^a-z0-9._ -]/gi, '').trim() || 'movie'
  const position = season && episode ? '-S' + season + 'E' + episode : ''
  return clean + position + '-' + (res || 720) + 'p.mp4'
}

function legacyStreamUrl(id, res, season, episode) {
  let url = LEGACY_BASE + '/api/bff/stream?subjectId=' + encodeURIComponent(id) + '&resolution=' + encodeURIComponent(res || 720)
  if (season && episode) url += '&se=' + encodeURIComponent(season) + '&ep=' + encodeURIComponent(episode)
  return url
}

function daveBffStreamUrl(id, res, season, episode) {
  const params = new URLSearchParams({ resolution: String(res || 720) })
  if (season && episode) {
    params.set('season', String(season))
    params.set('episode', String(episode))
  }
  return DAVEX_BASE + '/bff/stream/' + encodeURIComponent(id) + '?' + params.toString()
}

function isSafeMediaUrl(value) {
  try {
    const url = new URL(String(value))
    return url.protocol === 'https:' && (
      url.hostname === new URL(DAVEX_BASE).hostname ||
      url.hostname === new URL(LEGACY_BASE).hostname ||
      url.hostname.endsWith('.aoneroom.com')
    )
  } catch {
    return false
  }
}

function mediaUrls(value, output = []) {
  if (!value || output.length >= 30) return output
  if (typeof value === 'string') {
    if (isSafeMediaUrl(value)) output.push(value)
    return output
  }
  if (Array.isArray(value)) {
    for (const item of value) mediaUrls(item, output)
    return output
  }
  if (typeof value !== 'object') return output
  const priority = ['proxy_url', 'proxyUrl', 'download_url', 'downloadUrl', 'source_url', 'sourceUrl', 'resource_link', 'resourceLink', 'url']
  for (const key of priority) {
    if (value[key]) mediaUrls(value[key], output)
  }
  for (const [key, item] of Object.entries(value)) {
    if (!priority.includes(key) && !['captions', 'languages', 'subtitles'].includes(key)) mediaUrls(item, output)
  }
  return output
}

function normalizeSeasonDetails(payload) {
  const root = unwrap(payload)
  const seasons = Array.isArray(root?.seasons) ? root.seasons : []
  return seasons.map(item => {
    const number = asNumber(item?.season_number ?? item?.season)
    const available = String(item?.available_episodes || '')
      .split(/[,|\s]+/)
      .map(value => asNumber(value))
      .filter(Boolean)
    const resolutionEpisodes = Array.isArray(item?.resolutions)
      ? Math.max(...item.resolutions.map(value => asNumber(value?.ep_num)).filter(Boolean), 0)
      : 0
    const count = Math.max(asNumber(item?.max_episodes ?? item?.episode_count ?? item?.episodeCount), resolutionEpisodes, available.length ? Math.max(...available) : 0)
    return number ? { number, episodes: available.length ? available : Array.from({ length: count }, (_, index) => index + 1) } : null
  }).filter(Boolean)
}

function downloadEntries(payload) {
  const root = unwrap(payload)
  const byQuality = root?.by_quality || root?.byQuality
  if (byQuality && typeof byQuality === 'object') return Object.values(byQuality)
  for (const key of ['files', 'downloads', 'resources', 'results', 'items']) {
    if (Array.isArray(root?.[key])) return root[key]
  }
  return []
}

function normalizeDownloadFiles(payload, id, title) {
  return downloadEntries(payload).map((item, index) => {
    const resolution = asNumber(item?.resolution ?? item?.quality ?? item?.height, 0)
    const resourceId = firstText(item?.resource_id, item?.resourceId, String(index))
    return {
      resourceId,
      resolution,
      filename: firstText(item?.file_name, item?.filename, item?.title, safeFilename(title, resolution || 720)),
      size: item?.file_size ?? item?.size ?? 0,
      codec: firstText(item?.codec, item?.codec_name),
      duration: item?.duration ?? 0,
      browserCompatible: item?.browser_compatible !== false,
      downloadUrl: '/api/tools/movies?action=download&id=' + encodeURIComponent(id) + '&res=' + encodeURIComponent(resolution || 720) + '&resourceId=' + encodeURIComponent(resourceId) + '&title=' + encodeURIComponent(title || 'movie'),
    }
  }).filter(item => item.resolution || item.filename)
}

function normalizeCaptions(payload) {
  const root = unwrap(payload)
  const source = root?.captions || root?.subtitles || root
  if (Array.isArray(source)) return source.map(item => ({ language: firstText(item?.lanName, item?.language, item?.lang, 'Unknown'), url: firstText(item?.proxyUrl, item?.proxy_url, item?.url), format: firstText(item?.format, 'vtt') })).filter(item => item.url)
  if (source && typeof source === 'object') {
    return Object.entries(source).map(([language, item]) => ({ language, url: firstText(item?.proxyUrl, item?.proxy_url, item?.url), format: firstText(item?.format, 'vtt') })).filter(item => item.url)
  }
  return []
}

function normalizeStaff(payload) {
  const root = unwrap(payload)
  const list = root?.staff_list || root?.cast || root?.results || (Array.isArray(root) ? root : [])
  return Array.isArray(list) ? list.map(item => ({ name: firstText(item?.name, item?.actor, item?.character), character: firstText(item?.character, item?.role), avatar: firstText(item?.avatar_url, item?.avatar) })).filter(item => item.name) : []
}

function normalizeTrailer(payload) {
  const root = unwrap(payload)
  const address = root?.video_address || root?.videoAddress || root?.trailer?.video_address || root?.trailer?.videoAddress || root
  return {
    url: firstText(address?.url, address?.video_url, address?.videoUrl),
    cover: firstText(root?.cover?.url, root?.trailer?.cover?.url),
    duration: address?.duration || 0,
    definition: firstText(address?.definition, address?.quality),
  }
}

async function daveJson(path) {
  const response = await fetch(DAVEX_BASE + path, { headers: DAVE_JSON_HEADERS, signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error('Dave service ' + response.status + ': ' + path)
  return response.json()
}

async function legacyJson(path) {
  const response = await fetch(LEGACY_BASE + path, { headers: LEGACY_JSON_HEADERS, signal: AbortSignal.timeout(12000) })
  if (!response.ok) throw new Error('Legacy service ' + response.status + ': ' + path)
  return response.json()
}

function mediaResponse(upstream, { download = false, filename = 'movie.mp4' } = {}) {
  const headers = new Headers({ 'Access-Control-Allow-Origin': '*', 'Cache-Control': download ? 'no-store' : 'public, max-age=900' })
  for (const header of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
    const value = upstream.headers.get(header)
    if (value) headers.set(header, value)
  }
  if (download) headers.set('Content-Disposition', upstream.headers.get('content-disposition') || 'attachment; filename="' + filename + '"')
  return new Response(upstream.body, { status: upstream.status, headers })
}

async function fetchMedia(url, request, { download = false, timeout = 90000, filename = 'movie.mp4', headers = {} } = {}) {
  if (!isSafeMediaUrl(url)) throw new Error('unsafe-media-host')
  const range = request.headers.get('range') || ''
  const upstream = await fetch(url, {
    headers: { ...headers, Accept: 'video/mp4,video/webm,video/*,application/octet-stream,*/*;q=0.9', ...(range ? { Range: range } : {}) },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeout),
  })
  if (!upstream.ok) throw new Error('media ' + upstream.status)
  const type = upstream.headers.get('content-type') || ''
  if (!type.includes('video') && !type.includes('octet-stream') && !type.includes('mp4')) throw new Error('not-media')
  return mediaResponse(upstream, { download, filename })
}

async function legacyPlay(id) {
  const detail = await legacyJson('/api/rich-detail?subjectId=' + encodeURIComponent(id))
  const data = detail?.data || {}
  const isTV = (data.subjectType || 1) === 2
  const title = (data.title || '').replace(/\s*S\d.*/i, '').trim()
  const search = await legacyJson('/api/showbox/search?keyword=' + encodeURIComponent(title) + '&type=' + (isTV ? 'tv' : 'movie'))
  const item = search?.data?.[0]
  if (!item) throw new Error('legacy playback item not found')
  if (!isTV) {
    const movie = await legacyJson('/api/showbox/movie?id=' + encodeURIComponent(item.id))
    return { isTV: false, imdbId: movie?.data?.imdb_id || null, seasons: [], seasonDetails: [] }
  }
  const tv = await legacyJson('/api/showbox/tv?id=' + encodeURIComponent(item.id) + '&season=1&episode=1')
  const seasons = Array.isArray(tv?.data?.season) ? tv.data.season.map(asNumber).filter(Boolean) : [1]
  return { isTV: true, imdbId: tv?.data?.imdb_id || null, seasons, seasonDetails: [] }
}

async function davePlay(id) {
  const detail = await daveJson('/item/' + encodeURIComponent(id))
  const movie = normalizeMovie(detail)
  const isTV = movie.subjectType === 2
  let seasonDetails = []
  if (isTV) seasonDetails = normalizeSeasonDetails(await daveJson('/item/' + encodeURIComponent(id) + '/seasons'))
  return { isTV, imdbId: detail?.imdb_id || detail?.imdbId || null, seasons: seasonDetails.map(item => item.number), seasonDetails }
}

async function daveMediaMetadata(id, res, season, episode, title, resourceId = '') {
  const isTV = Boolean(season && episode)
  const paths = [
    '/item/' + encodeURIComponent(id) + '/downloads?resolution=' + encodeURIComponent(res || 720) + (isTV ? '&season=' + encodeURIComponent(season) + '&episode=' + encodeURIComponent(episode) : ''),
    '/download/' + encodeURIComponent(id) + '?resolution=' + encodeURIComponent(res || 720) + (isTV ? '&season=' + encodeURIComponent(season) + '&episode=' + encodeURIComponent(episode) : ''),
    isTV
      ? '/tv/episode/download/' + encodeURIComponent(id) + '?season=' + encodeURIComponent(season) + '&episode=' + encodeURIComponent(episode) + '&resolution=' + encodeURIComponent(res || 720)
      : '/movie/stream/' + encodeURIComponent(id) + '?resolution=' + encodeURIComponent(res || 720),
  ]
  const candidates = []
  for (const path of paths) {
    try {
      const payload = await daveJson(path)
      const entries = downloadEntries(payload)
      const selected = resourceId ? entries.find(item => String(item?.resource_id ?? item?.resourceId) === String(resourceId)) : entries.find(item => asNumber(item?.resolution ?? item?.quality) === asNumber(res))
      mediaUrls(selected || payload, candidates)
    } catch (error) {
      console.warn('[movies:davex-metadata]', path, error.message)
    }
  }
  return [...new Set(candidates)]
}

async function legacyMediaOrFallback({ id, res, season, episode, title, resourceId, request, download }) {
  const filename = safeFilename(title, res, season, episode)
  try {
    return await fetchMedia(legacyStreamUrl(id, res, season, episode), request, { download, filename, headers: LEGACY_BROWSER_HEADERS })
  } catch (error) {
    console.warn('[movies:legacy-primary-media]', error.message)
  }

  const candidates = []
  if (download) candidates.push(...await daveMediaMetadata(id, res, season, episode, title, resourceId || request.headers.get('x-resource-id') || ''))
  candidates.push(daveBffStreamUrl(id, res, season, episode))
  if (!download) {
    const streamPath = season && episode
      ? '/tv/episode/stream/' + encodeURIComponent(id) + '?season=' + encodeURIComponent(season) + '&episode=' + encodeURIComponent(episode) + '&resolution=' + encodeURIComponent(res || 720)
      : '/movie/stream/' + encodeURIComponent(id) + '?resolution=' + encodeURIComponent(res || 720)
    try { candidates.push(...mediaUrls(await daveJson(streamPath))) } catch (error) { console.warn('[movies:davex-stream-metadata]', error.message) }
  }

  let lastError = null
  for (const mediaUrl of [...new Set(candidates)]) {
    try {
      return await fetchMedia(mediaUrl, request, { download, filename, headers: DAVE_JSON_HEADERS })
    } catch (error) {
      lastError = error
      console.warn('[movies:davex-fallback-media]', error.message)
    }
  }
  throw lastError || new Error('media unavailable')
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
  const resourceId = searchParams.get('resourceId') || ''

  if (action === 'stream' || action === 'download' || action === 'legacy-download') {
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    try {
      return await legacyMediaOrFallback({ id, res, season, episode, title, resourceId, request: req, download: action !== 'stream' })
    } catch (error) {
      console.error('[movies:media-final]', error.message)
      return NextResponse.json({ error: action === 'stream' ? 'Movie stream is temporarily unavailable.' : 'Movie download is temporarily unavailable.' }, { status: 502 })
    }
  }

  try {
    if (action === 'trending' || action === 'hot') {
      try {
        const legacy = await legacyJson('/api/' + action)
        return NextResponse.json(listResponse(normalizeLegacyCollection(legacy), { operation: 'movies.' + action }))
      } catch (error) {
        const dave = await daveJson('/' + action + '?page=1&tab=0')
        return NextResponse.json(listResponse(normalizeCollection(dave), { operation: 'movies.' + action }))
      }
    }

    if (action === 'home') {
      const home = await daveJson('/homepage?tab=0&page=1&mode=clean')
      const sections = (unwrap(home)?.sections || []).map(section => ({ title: firstText(section?.title, section?.name, 'Featured'), items: normalizeCollection(section) })).filter(section => section.items.length)
      return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', operation: 'movies.home', data: { sections, subjectList: sections[0]?.items || [] } }))
    }

    if (action === 'discover') {
      const path = '/discover?type=' + encodeURIComponent(searchParams.get('contentType') || 'MOVIE') + '&genre=' + encodeURIComponent(searchParams.get('genre') || '') + '&page=1&per_page=20'
      return NextResponse.json(listResponse(normalizeCollection(await daveJson(path)), { operation: 'movies.discover' }))
    }

    if (action === 'search') {
      if (!q.trim()) return NextResponse.json(listResponse([], { operation: 'movies.search' }))
      try {
        const legacy = await legacyJson('/api/search?keyword=' + encodeURIComponent(q) + (type ? '&type=' + encodeURIComponent(type) : ''))
        return NextResponse.json(listResponse(normalizeLegacyCollection(legacy), { operation: 'movies.search' }))
      } catch {
        const path = '/search?q=' + encodeURIComponent(q) + '&type=' + daveType(type) + '&page=1&per_page=20'
        return NextResponse.json(listResponse(normalizeCollection(await daveJson(path)), { operation: 'movies.search' }))
      }
    }

    if (action === 'suggest') {
      return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', operation: 'movies.suggest', data: normalizeCollection(await daveJson('/suggest?q=' + encodeURIComponent(q) + '&limit=10')) } ))
    }

    const daveRail = {
      'movie-popular': '/movie/popular?page=1',
      'movie-new': '/movie/new?page=1&per_page=20',
      'movie-top': '/movie/top?page=1&per_page=20',
      'movie-genre': '/movie/genre?genre=' + encodeURIComponent(searchParams.get('genre') || 'Action') + '&page=1&per_page=20',
      'tv-popular': '/tv/popular?page=1',
      'tv-new': '/tv/new?page=1&per_page=20',
      'tv-trending': '/tv/trending?page=1&per_page=20',
      'tv-genre': '/tv/genre?genre=' + encodeURIComponent(searchParams.get('genre') || 'Drama') + '&page=1&per_page=20',
    }[action]
    if (daveRail) return NextResponse.json(listResponse(normalizeCollection(await daveJson(daveRail)), { operation: 'movies.' + action }))

    if (action === 'detail' || action === 'movie-info' || action === 'tv-info') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      try {
        const legacy = await legacyJson('/api/rich-detail?subjectId=' + encodeURIComponent(id))
        return NextResponse.json(detailResponse(normalizeMovie(legacy?.data), { operation: 'movies.detail' }))
      } catch {
        const path = action === 'movie-info' ? '/movie/info/' + encodeURIComponent(id) : action === 'tv-info' ? '/tv/info/' + encodeURIComponent(id) : '/item/' + encodeURIComponent(id)
        return NextResponse.json(detailResponse(normalizeMovie(await daveJson(path)), { operation: 'movies.detail' }))
      }
    }

    if (action === 'play') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      try { return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', data: await legacyPlay(id) })) } catch {}
      return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', data: await davePlay(id) }))
    }

    if (action === 'seasons' || action === 'tv-seasons') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      const payload = await daveJson('/' + (action === 'tv-seasons' ? 'tv/seasons/' : 'item/') + encodeURIComponent(id) + (action === 'tv-seasons' ? '' : '/seasons'))
      return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', operation: 'movies.seasons', data: { seasons: normalizeSeasonDetails(payload) } }))
    }

    if (action === 'recommend' || action === 'movie-recommend' || action === 'tv-recommend') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      if (action === 'recommend') {
        try {
          const legacy = await legacyJson('/api/recommend?subjectId=' + encodeURIComponent(id) + '&page=1&perPage=12')
          return NextResponse.json(listResponse(normalizeLegacyCollection(legacy), { operation: 'movies.recommend' }))
        } catch {}
      }
      let tv = action === 'tv-recommend'
      if (action === 'recommend') {
        try { tv = (normalizeMovie(await daveJson('/item/' + encodeURIComponent(id)))).subjectType === 2 } catch {}
      }
      const path = tv ? '/tv/recommend/' : '/movie/recommend/'
      return NextResponse.json(listResponse(normalizeCollection(await daveJson(path + encodeURIComponent(id) + '?limit=12')), { operation: 'movies.recommend' }))
    }

    if (action === 'trailer') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', operation: 'movies.trailer', data: normalizeTrailer(await daveJson('/item/' + encodeURIComponent(id) + '/trailer')) }))
    }

    if (action === 'cast') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', operation: 'movies.cast', data: normalizeStaff(await daveJson('/item/' + encodeURIComponent(id) + '/cast')) }))
    }

    if (action === 'dubs') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      const root = unwrap(await daveJson('/item/' + encodeURIComponent(id) + '/dubs'))
      return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', operation: 'movies.dubs', data: root?.dubs || root?.languages || root }))
    }

    if (action === 'resources' || action === 'downloads') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      const path = action === 'resources'
        ? '/item/' + encodeURIComponent(id) + '/resources'
        : '/item/' + encodeURIComponent(id) + '/downloads?resolution=' + encodeURIComponent(res) + (season && episode ? '&season=' + encodeURIComponent(season) + '&episode=' + encodeURIComponent(episode) : '')
      const payload = await daveJson(path)
      return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', operation: 'movies.' + action, data: { files: action === 'downloads' ? normalizeDownloadFiles(payload, id, title) : downloadEntries(payload), rawResourceCount: downloadEntries(payload).length } }))
    }

    if (action === 'captions') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      const path = '/item/' + encodeURIComponent(id) + '/captions/auto?resolution=' + encodeURIComponent(res) + (season && episode ? '&season=' + encodeURIComponent(season) + '&episode=' + encodeURIComponent(episode) : '')
      return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', operation: 'movies.captions', data: normalizeCaptions(await daveJson(path)) }))
    }

    if (action === 'stream-meta') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      const path = season && episode ? '/tv/episode/stream/' + encodeURIComponent(id) + '?season=' + encodeURIComponent(season) + '&episode=' + encodeURIComponent(episode) + '&resolution=' + encodeURIComponent(res) : '/stream/' + encodeURIComponent(id) + '?resolution=' + encodeURIComponent(res)
      return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', operation: 'movies.stream', data: { urls: mediaUrls(await daveJson(path)) } }))
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('[movies]', error.message)
    return NextResponse.json({ error: 'Movies service is temporarily unavailable. Try again shortly.' }, { status: 502 })
  }
}
