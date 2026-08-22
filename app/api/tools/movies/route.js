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

const SOURCE_CACHE_TTL = 60 * 1000
const SOURCE_STALE_TTL = 15 * 60 * 1000
const PROVIDER_FAILURE_WINDOW = 60 * 1000
const PROVIDER_FAILURE_THRESHOLD = 3
const PROVIDER_COOLDOWN = 30 * 1000
const SOURCE_CACHE_MAX = 500
const MEDIA_PROBE_ATTEMPTS = 2
const MEDIA_PROBE_RETRY_DELAY = 650

const runtimeStore = globalThis.__toosiiMovieRuntimeStore || (globalThis.__toosiiMovieRuntimeStore = {
  sourceCache: new Map(),
  providerHealth: new Map(),
})

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function asNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function isRetryableStatus(status) {
  return [408, 425, 429, 500, 502, 503, 504].includes(Number(status))
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
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
      mediaKind: firstText(raw?.media_kind, raw?.mediaKind, raw?.content_type, String(genre || '').toLowerCase().includes('anime') ? 'anime' : subjectType === 2 ? 'series' : 'movie'),
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

function normalizeAnime(raw = {}) {
  return { ...normalizeMovie(raw), mediaKind: 'anime' }
}

function normalizeLive(raw = {}) {
  return { ...normalizeMovie(raw), subjectType: 9, mediaKind: 'live', isLive: true }
}

function normalizeAnimeCollection(payload) {
  return pickCollection(payload)
    .map(normalizeAnime)
    .filter(item => item.subjectId && item.title)
}

function normalizeLiveCollection(payload) {
  return pickCollection(payload)
    .map(normalizeLive)
    .filter(item => item.subjectId && item.title)
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
  if (type === 'anime' || type === '3') return 'ANIME'
  if (type === 'live') return 'LIVE'
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

function daveBffVariantUrl(id, res, season, episode) {
  if (!season || !episode) return ''
  const params = new URLSearchParams({ resolution: String(res || 720), se: String(season), ep: String(episode) })
  return DAVEX_BASE + '/bff/stream/' + encodeURIComponent(id) + '?' + params.toString()
}

function daveDownloadProxyUrl(id, res, season, episode, title) {
  const params = new URLSearchParams({
    subjectId: String(id),
    resolution: String(res || 720),
    filename: safeFilename(title, res, season, episode),
  })
  if (season && episode) {
    params.set('season', String(season))
    params.set('episode', String(episode))
  }
  return DAVEX_BASE + '/proxy/download?' + params.toString()
}

function isSafeMediaUrl(value) {
  try {
    const url = new URL(String(value))
    return url.protocol === 'https:' && (
      url.hostname === new URL(DAVEX_BASE).hostname ||
      url.hostname === new URL(LEGACY_BASE).hostname ||
      url.hostname.endsWith('.aoneroom.com') ||
      url.hostname.endsWith('.hakunaymatata.com')
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
  for (const key of ['files', 'downloads', 'resources', 'results', 'items', 'list', 'all_files', 'allFiles']) {
    if (Array.isArray(root?.[key])) return root[key]
  }
  return []
}

function normalizeDownloadFiles(payload, id, title, kind = 'movie', season = '', episode = '') {
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
      downloadUrl: '/api/tools/movies?action=download&id=' + encodeURIComponent(id) + '&kind=' + encodeURIComponent(kind) + '&res=' + encodeURIComponent(resolution || 720) + '&resourceId=' + encodeURIComponent(resourceId) + '&title=' + encodeURIComponent(title || 'movie') + (season || item?.season ? '&se=' + encodeURIComponent(season || item.season) : '') + (episode || item?.episode ? '&ep=' + encodeURIComponent(episode || item.episode) : ''),
    }
  }).filter(item => item.resolution || item.filename)
}

function normalizeDubs(value) {
  const source = Array.isArray(value) ? value : Object.values(value || {})
  return source.map(item => typeof item === 'string' ? item : firstText(item?.lan_name, item?.language, item?.name, item?.lan_code, item?.title)).filter(Boolean)
}

function normalizeStreamPayload(payload) {
  const root = unwrap(payload)
  const streams = Array.isArray(root?.streams) ? root.streams : Array.isArray(root?.mp4_streams) ? root.mp4_streams : []
  const selected = streams.find(item => String(item?.format || '').toLowerCase() === 'mp4') || streams[0] || {}
  const url = firstText(root?.playback_url, root?.playbackUrl, root?.url, root?.stream_url, selected?.proxyUrl, selected?.proxy_url)
  return {
    url,
    playbackUrl: url,
    browserCompatible: root?.browser_compatible !== false,
    available: root?.available !== false,
    resolution: root?.resolution || selected?.resolution || 0,
    availableQualities: root?.available_qualities || root?.availableQualities || streams.map(item => asNumber(item?.resolution)).filter(Boolean),
    urls: mediaUrls(payload),
  }
}

function normalizeAnimeDetail(payload) {
  const root = unwrap(payload)
  const base = normalizeAnime(root)
  const totalEpisodes = Math.max(
    asNumber(root?.season_numbers),
    ...((root?.resource_detectors || []).map(item => asNumber(item?.total_episode)).filter(Boolean)),
    0,
  )
  return {
    ...base,
    cast: normalizeStaff(payload),
    dubs: normalizeDubs(root?.dubs),
    subtitleLanguages: Array.isArray(root?.subtitles) ? root.subtitles.map(item => String(item)).filter(Boolean) : [],
    totalEpisodes,
  }
}

function animeFallbackSeasons(payload = {}) {
  const root = unwrap(payload)
  const total = Math.min(Math.max(asNumber(root?.season_numbers), ...((root?.resource_detectors || []).map(item => asNumber(item?.total_episode)).filter(Boolean)), 24), 100)
  return [{ number: 1, episodes: Array.from({ length: total }, (_, index) => index + 1) }]
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

async function fetchWithTimeout(url, options, timeout, label) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error((label || 'upstream') + ' timeout')
    throw error
  } finally {
    clearTimeout(timer)
  }
}

async function daveJson(path) {
  const response = await fetchWithTimeout(DAVEX_BASE + path, { headers: DAVE_JSON_HEADERS }, 15000, 'Dave service')
  if (!response.ok) throw new Error('Dave service ' + response.status + ': ' + path)
  return response.json()
}

async function legacyJson(path) {
  const response = await fetchWithTimeout(LEGACY_BASE + path, { headers: LEGACY_JSON_HEADERS }, 12000, 'Legacy service')
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
  const upstream = await fetchWithTimeout(url, {
    headers: { ...headers, Accept: 'video/mp4,video/webm,video/*,application/octet-stream,*/*;q=0.9', ...(range ? { Range: range } : {}) },
    redirect: 'follow',
  }, timeout, 'media')
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
    isTV
      ? '/tv/episode/stream/' + encodeURIComponent(id) + '?season=' + encodeURIComponent(season) + '&episode=' + encodeURIComponent(episode) + '&resolution=' + encodeURIComponent(res || 720)
      : '/movie/stream/' + encodeURIComponent(id) + '?resolution=' + encodeURIComponent(res || 720),
    '/item/' + encodeURIComponent(id) + '/downloads?resolution=' + encodeURIComponent(res || 720) + (isTV ? '&season=' + encodeURIComponent(season) + '&episode=' + encodeURIComponent(episode) : ''),
    '/download/' + encodeURIComponent(id) + '?resolution=' + encodeURIComponent(res || 720) + (isTV ? '&season=' + encodeURIComponent(season) + '&episode=' + encodeURIComponent(episode) : ''),
    isTV
      ? '/tv/episode/download/' + encodeURIComponent(id) + '?season=' + encodeURIComponent(season) + '&episode=' + encodeURIComponent(episode) + '&resolution=' + encodeURIComponent(res || 720)
      : '',
  ].filter(Boolean)
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

function sourceCacheKey({ id, res, season, episode, download, resourceId = '' }) {
  return [download ? 'download' : 'stream', String(id), String(res || 720), String(season || ''), String(episode || ''), download ? String(resourceId || '') : ''].join(':')
}

function putSourceCache(key, value) {
  if (!runtimeStore.sourceCache.has(key) && runtimeStore.sourceCache.size >= SOURCE_CACHE_MAX) {
    const oldestKey = runtimeStore.sourceCache.keys().next().value
    if (oldestKey) runtimeStore.sourceCache.delete(oldestKey)
  }
  runtimeStore.sourceCache.set(key, value)
}

function providerHealthKey(provider, download) {
  return provider + ':' + (download ? 'download' : 'stream')
}

function providerCircuitOpen(provider, download) {
  const health = runtimeStore.providerHealth.get(providerHealthKey(provider, download))
  return Boolean(health?.openUntil && health.openUntil > Date.now())
}

function noteProviderSuccess(provider, download) {
  runtimeStore.providerHealth.set(providerHealthKey(provider, download), { failures: 0, openUntil: 0, lastSuccessAt: Date.now() })
}

function noteProviderFailure(provider, download) {
  const key = providerHealthKey(provider, download)
  const now = Date.now()
  const previous = runtimeStore.providerHealth.get(key) || { failures: 0, openUntil: 0 }
  const failures = previous.lastFailureAt && now - previous.lastFailureAt < PROVIDER_FAILURE_WINDOW ? previous.failures + 1 : 1
  runtimeStore.providerHealth.set(key, {
    failures,
    lastFailureAt: now,
    openUntil: failures >= PROVIDER_FAILURE_THRESHOLD ? now + PROVIDER_COOLDOWN : 0,
    lastSuccessAt: previous.lastSuccessAt || 0,
  })
}

async function probeMediaUrl(url, label) {
  if (!isSafeMediaUrl(url)) throw new Error('unsafe-media-host')
  let lastError
  for (let attempt = 0; attempt < MEDIA_PROBE_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, {
        headers: {
          ...DAVE_JSON_HEADERS,
          Accept: 'video/mp4,video/webm,video/*,application/octet-stream,*/*;q=0.9',
          'Accept-Encoding': 'identity',
          Range: 'bytes=0-1023',
        },
        redirect: 'follow',
      }, 20000, label || 'media probe')
      if (!response.ok) {
        if (isRetryableStatus(response.status) && attempt < MEDIA_PROBE_ATTEMPTS - 1) {
          const retryAfter = Math.min(Math.max(asNumber(response.headers.get('retry-after'), 0) * 1000, MEDIA_PROBE_RETRY_DELAY), 3000)
          await response.body?.cancel?.()
          await wait(retryAfter)
          continue
        }
        throw new Error((label || 'media probe') + ' ' + response.status)
      }
      const type = response.headers.get('content-type') || ''
      if (!type.includes('video') && !type.includes('octet-stream') && !type.includes('mp4')) throw new Error('not-media')
      const body = await response.arrayBuffer()
      if (!body.byteLength) throw new Error('empty-media')
      return response
    } catch (error) {
      lastError = error
      if (attempt < MEDIA_PROBE_ATTEMPTS - 1 && !String(error?.message || '').includes('not-media')) {
        await wait(MEDIA_PROBE_RETRY_DELAY)
        continue
      }
      throw error
    }
  }
  throw lastError || new Error('media-probe-failed')
}

async function resolveDaveSource({ urls, cacheKey, download, force = false }) {
  const now = Date.now()
  const candidates = [...new Set((urls || []).filter(Boolean))]
  const cached = runtimeStore.sourceCache.get(cacheKey)
  if (!force && cached?.expiresAt > now && !providerCircuitOpen('dave', download)) {
    return { url: cached.url, cacheState: 'hit', verifiedAt: cached.verifiedAt }
  }
  if (providerCircuitOpen('dave', download)) {
    if (!force && cached?.verifiedAt && now - cached.verifiedAt < SOURCE_STALE_TTL) return { url: cached.url, cacheState: 'stale-circuit' }
    throw new Error('dave-circuit-open')
  }
  const failures = []
  for (const url of candidates) {
    try {
      await probeMediaUrl(url, download ? 'Dave download probe' : 'Dave stream probe')
      noteProviderSuccess('dave', download)
      putSourceCache(cacheKey, { url, verifiedAt: now, expiresAt: now + SOURCE_CACHE_TTL })
      return { url, cacheState: cached ? 'revalidated' : 'validated', verifiedAt: now }
    } catch (error) {
      failures.push(error.message)
    }
  }
  noteProviderFailure('dave', download)
  if (cached?.verifiedAt && now - cached.verifiedAt < SOURCE_STALE_TTL) return { url: cached.url, cacheState: force ? 'stale-after-retry' : 'stale-error', error: failures.join('; ') }
  throw new Error(failures.join('; ') || 'dave-no-source')
}

function mediaRedirect(url, extraHeaders = {}) {
  return new Response(null, {
    status: 307,
    headers: {
      Location: url,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'Referrer-Policy': 'no-referrer',
      ...extraHeaders,
    },
  })
}

async function daveMediaOrFallback({ id, res, season, episode, title, resourceId, request, download, force }) {
  const filename = safeFilename(title, res, season, episode)
  const daveUrls = download
    ? [daveDownloadProxyUrl(id, res, season, episode, title)]
    : [daveBffStreamUrl(id, res, season, episode), daveBffVariantUrl(id, res, season, episode)]
  const cacheKey = sourceCacheKey({ id, res, season, episode, download, resourceId })
  try {
    const source = await resolveDaveSource({ urls: daveUrls, cacheKey, download, force })
    return mediaRedirect(source.url, {
      'X-Toosii-Source': 'primary',
      'X-Toosii-Source-Cache': source.cacheState,
      ...(source.error ? { 'X-Toosii-Source-Warning': 'stale-source' } : {}),
    })
  } catch (error) {
    console.warn('[movies:dave-primary-media]', error.message)
  }

  try {
    const metadataUrls = await daveMediaMetadata(id, res, season, episode, title, resourceId || request.headers.get('x-resource-id') || '')
    const metadataSource = await resolveDaveSource({ urls: metadataUrls, cacheKey, download, force: true })
    return mediaRedirect(metadataSource.url, {
      'X-Toosii-Source': 'primary-metadata',
      'X-Toosii-Source-Cache': metadataSource.cacheState,
    })
  } catch (error) {
    console.warn('[movies:davex-metadata-media]', error.message)
  }

  try {
    const response = await fetchMedia(legacyStreamUrl(id, res, season, episode), request, {
      download,
      filename,
      headers: LEGACY_BROWSER_HEADERS,
      timeout: 8000,
    })
    return response
  } catch (error) {
    console.warn('[movies:legacy-fallback-media]', error.message)
    throw new Error(download ? 'Movie download is temporarily unavailable.' : 'Movie stream is temporarily unavailable.')
  }
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
  const kind = searchParams.get('kind') || ''
  const retry = asNumber(searchParams.get('retry'), 0)

  if (action === 'stream' || action === 'download' || action === 'legacy-download') {
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    try {
      if (kind === 'live' && action !== 'stream') return NextResponse.json({ error: 'Live events are stream-only.' }, { status: 400 })
      const isDownload = action !== 'stream'
      // Downloads must always revalidate the source immediately before returning a
      // redirect; otherwise a cached 307 can make a mobile browser save an
      // upstream JSON error response as a .json file after the provider goes down.
      return await daveMediaOrFallback({ id, res, season, episode, title, resourceId, request: req, download: isDownload, force: isDownload || retry > 0 })
    } catch (error) {
      console.error('[movies:media-final]', error.message)
      return NextResponse.json({
        error: action === 'stream' ? 'Movie stream is temporarily unavailable. Please retry shortly.' : 'Movie download is temporarily unavailable. Please retry shortly.',
        retryable: true,
      }, {
        status: 503,
        headers: { 'Retry-After': '5', 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      })
    }
  }

  try {
    if (action === 'trending' || action === 'hot') {
      try {
        const dave = await daveJson('/' + action + '?page=1&tab=0')
        return NextResponse.json(listResponse(normalizeCollection(dave), { operation: 'movies.' + action, provider: 'Toosii Primary' }))
      } catch (error) {
        console.warn('[movies:dave-primary-catalog]', error.message)
        const legacy = await legacyJson('/api/' + action)
        return NextResponse.json(listResponse(normalizeLegacyCollection(legacy), { operation: 'movies.' + action, provider: 'Toosii Fallback' }))
      }
    }

    if (action === 'home') {
      const home = await daveJson('/homepage?tab=0&page=1&mode=clean')
      const sections = (unwrap(home)?.sections || []).map(section => ({ title: firstText(section?.title, section?.name, 'Featured'), items: normalizeCollection(section) })).filter(section => section.items.length)
      return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', operation: 'movies.home', provider: 'Toosii Primary', data: { sections, subjectList: sections[0]?.items || [] } }))
    }

    if (action === 'discover') {
      const path = '/discover?type=' + encodeURIComponent(searchParams.get('contentType') || 'MOVIE') + '&genre=' + encodeURIComponent(searchParams.get('genre') || '') + '&page=1&per_page=20'
      return NextResponse.json(listResponse(normalizeCollection(await daveJson(path)), { operation: 'movies.discover', provider: 'Toosii Primary' }))
    }

    if (action === 'search') {
      if (!q.trim()) return NextResponse.json(listResponse([], { operation: 'movies.search' }))
      if (type === 'anime') return NextResponse.json(listResponse(normalizeAnimeCollection(await daveJson('/anime/search?q=' + encodeURIComponent(q) + '&page=1&per_page=20')), { operation: 'anime.search' }))
      if (type === 'live') return NextResponse.json(listResponse(normalizeLiveCollection(await daveJson('/live/search?q=' + encodeURIComponent(q) + '&page=1&per_page=20')), { operation: 'live.search' }))
      try {
        const path = '/search?q=' + encodeURIComponent(q) + '&type=' + daveType(type) + '&page=1&per_page=20'
        return NextResponse.json(listResponse(normalizeCollection(await daveJson(path)), { operation: 'movies.search', provider: 'Toosii Primary' }))
      } catch (error) {
        console.warn('[movies:dave-primary-search]', error.message)
        const legacy = await legacyJson('/api/search?keyword=' + encodeURIComponent(q) + (type ? '&type=' + encodeURIComponent(type) : ''))
        return NextResponse.json(listResponse(normalizeLegacyCollection(legacy), { operation: 'movies.search', provider: 'Toosii Fallback' }))
      }
    }

    if (action === 'suggest') {
      return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', operation: 'movies.suggest', provider: 'Toosii Primary', data: normalizeCollection(await daveJson('/suggest?q=' + encodeURIComponent(q) + '&limit=10')) } ))
    }

    if (action === 'anime-home') {
      const payload = await daveJson('/anime/home')
      const sections = (unwrap(payload)?.sections || []).map(section => ({ title: firstText(section?.section_title, section?.title, 'Anime'), items: normalizeAnimeCollection(section) })).filter(section => section.items.length)
      return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', operation: 'anime.home', provider: 'Toosii Primary', data: { sections, subjectList: sections[0]?.items || [], items: sections.flatMap(section => section.items) } }))
    }

    if (action === 'live') return NextResponse.json(listResponse(normalizeLiveCollection(await daveJson('/live?page=1')), { operation: 'live.browse', provider: 'Toosii Primary' }))
    if (action === 'live-search') return NextResponse.json(listResponse(normalizeLiveCollection(await daveJson('/live/search?q=' + encodeURIComponent(q) + '&page=1&per_page=20')), { operation: 'live.search', provider: 'Toosii Primary' }))

    const daveRail = {
      'movie-popular': ['/movie/popular?page=1', normalizeCollection],
      'movie-new': ['/movie/new?page=1&per_page=20', normalizeCollection],
      'movie-top': ['/movie/top?page=1&per_page=20', normalizeCollection],
      'movie-genre': ['/movie/genre?genre=' + encodeURIComponent(searchParams.get('genre') || 'Action') + '&page=1&per_page=20', normalizeCollection],
      'tv-popular': ['/tv/popular?page=1', normalizeCollection],
      'tv-new': ['/tv/new?page=1&per_page=20', normalizeCollection],
      'tv-trending': ['/tv/trending?page=1&per_page=20', normalizeCollection],
      'tv-genre': ['/tv/genre?genre=' + encodeURIComponent(searchParams.get('genre') || 'Drama') + '&page=1&per_page=20', normalizeCollection],
      'anime-trending': ['/anime/trending?sort=hot&page=1&per_page=20', normalizeAnimeCollection],
      'anime-browse': ['/anime/browse?sort=forYou&genre=Animation&page=1&per_page=20', normalizeAnimeCollection],
    }[action]
    if (daveRail) return NextResponse.json(listResponse(daveRail[1](await daveJson(daveRail[0])), { operation: 'media.' + action, provider: 'Toosii Primary' }))

    if (action === 'anime-info') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      return NextResponse.json(detailResponse(normalizeAnimeDetail(await daveJson('/anime/info/' + encodeURIComponent(id))), { operation: 'anime.info' }))
    }

    if (action === 'detail' || action === 'movie-info' || action === 'tv-info') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      const path = action === 'movie-info' ? '/movie/info/' + encodeURIComponent(id) : action === 'tv-info' ? '/tv/info/' + encodeURIComponent(id) : '/item/' + encodeURIComponent(id)
      try {
        return NextResponse.json(detailResponse(normalizeMovie(await daveJson(path)), { operation: 'movies.detail', provider: 'Toosii Primary' }))
      } catch (error) {
        console.warn('[movies:dave-primary-detail]', error.message)
        const legacy = await legacyJson('/api/rich-detail?subjectId=' + encodeURIComponent(id))
        return NextResponse.json(detailResponse(normalizeMovie(legacy?.data), { operation: 'movies.detail', provider: 'Toosii Fallback' }))
      }
    }

    if (action === 'anime-play') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      const payload = await daveJson('/anime/stream/' + encodeURIComponent(id) + '?resolution=' + encodeURIComponent(res) + (season ? '&season=' + encodeURIComponent(season) : '') + (episode ? '&episode=' + encodeURIComponent(episode) : ''))
      const selectedSeason = Number(season) || 1
      return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', operation: 'anime.stream', data: { ...normalizeStreamPayload(payload), isTV: true, seasons: [selectedSeason], seasonDetails: [{ number: selectedSeason, episodes: Array.from({ length: 24 }, (_, index) => index + 1) }] } }))
    }

    if (action === 'live-stream-meta') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', operation: 'live.stream', data: normalizeStreamPayload(await daveJson('/live/stream/' + encodeURIComponent(id) + '?resolution=' + encodeURIComponent(res))) }))
    }

    if (action === 'play') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      try { return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', provider: 'Toosii Primary', data: await davePlay(id) })) } catch (error) {
        console.warn('[movies:dave-primary-play]', error.message)
        return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', provider: 'Toosii Fallback', data: await legacyPlay(id) }))
      }
    }

    if (action === 'anime-seasons') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      try {
        return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', operation: 'anime.seasons', data: { seasons: normalizeSeasonDetails(await daveJson('/anime/seasons/' + encodeURIComponent(id))) } }))
      } catch {
        const info = await daveJson('/anime/info/' + encodeURIComponent(id))
        return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', operation: 'anime.seasons', data: { seasons: animeFallbackSeasons(info), fallback: true } }))
      }
    }

    if (action === 'seasons' || action === 'tv-seasons') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      const payload = await daveJson('/' + (action === 'tv-seasons' ? 'tv/seasons/' : 'item/') + encodeURIComponent(id) + (action === 'tv-seasons' ? '' : '/seasons'))
      return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', operation: 'movies.seasons', data: { seasons: normalizeSeasonDetails(payload) } }))
    }

    if (action === 'recommend' || action === 'movie-recommend' || action === 'tv-recommend') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      let tv = action === 'tv-recommend'
      if (action === 'recommend') {
        try { tv = (normalizeMovie(await daveJson('/item/' + encodeURIComponent(id)))).subjectType === 2 } catch {}
      }
      const path = tv ? '/tv/recommend/' : '/movie/recommend/'
      try {
        return NextResponse.json(listResponse(normalizeCollection(await daveJson(path + encodeURIComponent(id) + '?limit=12')), { operation: 'movies.recommend', provider: 'Toosii Primary' }))
      } catch (error) {
        console.warn('[movies:dave-primary-recommend]', error.message)
        const legacy = await legacyJson('/api/recommend?subjectId=' + encodeURIComponent(id) + '&page=1&perPage=12')
        return NextResponse.json(listResponse(normalizeLegacyCollection(legacy), { operation: 'movies.recommend', provider: 'Toosii Fallback' }))
      }
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

    if (action === 'anime-captions') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      const path = '/anime/captions/' + encodeURIComponent(id) + '?resolution=' + encodeURIComponent(res) + (season ? '&season=' + encodeURIComponent(season) : '') + (episode ? '&episode=' + encodeURIComponent(episode) : '')
      return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', operation: 'anime.captions', data: normalizeCaptions(await daveJson(path)) }))
    }

    if (action === 'anime-downloads') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      const path = season && episode
        ? '/anime/episode/download/' + encodeURIComponent(id) + '?season=' + encodeURIComponent(season) + '&episode=' + encodeURIComponent(episode) + '&resolution=' + encodeURIComponent(res)
        : '/anime/download/' + encodeURIComponent(id) + '?resolution=' + encodeURIComponent(res)
      const payload = await daveJson(path)
      return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', operation: 'anime.downloads', data: { files: normalizeDownloadFiles(payload, id, title, 'anime', season, episode), rawResourceCount: downloadEntries(payload).length } }))
    }

    if (action === 'resources' || action === 'downloads') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      const path = action === 'resources'
        ? '/item/' + encodeURIComponent(id) + '/resources'
        : '/item/' + encodeURIComponent(id) + '/downloads?resolution=' + encodeURIComponent(res) + (season && episode ? '&season=' + encodeURIComponent(season) + '&episode=' + encodeURIComponent(episode) : '')
      const payload = await daveJson(path)
      return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', operation: 'movies.' + action, data: { files: action === 'downloads' ? normalizeDownloadFiles(payload, id, title, 'movie', season, episode) : downloadEntries(payload), rawResourceCount: downloadEntries(payload).length } }))
    }

    if (action === 'captions') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      const path = '/item/' + encodeURIComponent(id) + '/captions/auto?resolution=' + encodeURIComponent(res) + (season && episode ? '&season=' + encodeURIComponent(season) + '&episode=' + encodeURIComponent(episode) : '')
      return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', operation: 'movies.captions', data: normalizeCaptions(await daveJson(path)) }))
    }

    if (action === 'stream-meta') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      const path = kind === 'anime'
        ? '/anime/stream/' + encodeURIComponent(id) + '?resolution=' + encodeURIComponent(res) + (season ? '&season=' + encodeURIComponent(season) : '') + (episode ? '&episode=' + encodeURIComponent(episode) : '')
        : kind === 'live'
          ? '/live/stream/' + encodeURIComponent(id) + '?resolution=' + encodeURIComponent(res)
          : season && episode ? '/tv/episode/stream/' + encodeURIComponent(id) + '?season=' + encodeURIComponent(season) + '&episode=' + encodeURIComponent(episode) + '&resolution=' + encodeURIComponent(res) : '/stream/' + encodeURIComponent(id) + '?resolution=' + encodeURIComponent(res)
      return NextResponse.json(brandPublicResponse({ success: true, api: 'Toosii API', operation: 'media.stream', data: { urls: mediaUrls(await daveJson(path)) } }))
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('[movies]', error.message)
    return NextResponse.json({ error: 'Movies service is temporarily unavailable. Try again shortly.' }, { status: 502 })
  }
}
