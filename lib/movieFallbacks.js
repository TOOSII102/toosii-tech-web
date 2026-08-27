import { brandPublicResponse } from './brandPublicResponse'

const CONSUMET_BASE = 'https://api.consumet.org/movies/tmdb'
const IMDB_PROXY_BASE = 'https://imdb.iamidiotareyoutoo.com'
const TVMAZE_BASE = 'https://api.tvmaze.com'
const ALLINONE_BASE = 'https://allinoneapi.vercel.app'
const GHIBLI_BASE = 'https://ghibliapi.vercel.app'
const KATDB_BASE = 'https://katdb-bogk.onrender.com'
const XCASPER_BASE = 'https://movieapi.xcasper.space'
const PRIMESRC_BASE = 'https://primesrc.me'
const APIFY_ACTOR = 'moving_beacon-owner1~streaming-catalog-scraper'
const catalogCache = new Map()

const asNumber = (value, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

const firstText = (...values) => values.find(value => value !== undefined && value !== null && String(value).trim() !== '') || ''

async function fallbackJson(url, options = {}, timeout = 10000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { Accept: 'application/json', ...(options.headers || {}) },
    })
    if (!response.ok) throw new Error(`Fallback provider ${response.status}`)
    return response.json()
  } finally {
    clearTimeout(timer)
  }
}

async function cached(key, loader, ttl = 5 * 60 * 1000) {
  const current = catalogCache.get(key)
  if (current?.expiresAt > Date.now()) return current.value
  const value = await loader()
  catalogCache.set(key, { value, expiresAt: Date.now() + ttl })
  return value
}

function stripMarkup(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function itemsFrom(payload) {
  if (Array.isArray(payload)) return payload
  const root = payload?.data ?? payload ?? {}
  if (Array.isArray(root)) return root
  return [root.results, root.items, root.movies, root.shows, root.subjectList, root.list, root.Search, root.data].find(Array.isArray) || []
}

function normalizeItem(raw, provider, forcedKind = '') {
  const value = raw?.show || raw?.data || raw || {}
  const sourceId = firstText(value.subject_id, value.subjectId, value.id, value._id, value.tmdb_id, value.imdb_id)
  const title = firstText(value.title, value.name, value.movieName, value.post_title)
  if (!sourceId || !title) return null

  const source = String(provider || 'fallback').toLowerCase()
  const isSeries = forcedKind === 'series' || source === 'tvmaze' || Number(value.subject_type || value.subjectType) === 2 || String(value.type || '').toLowerCase() === 'series'
  const cover = firstText(
    value.image?.original,
    value.image?.medium,
    value.cover?.url,
    value.cover?.source_url,
    value.img,
    value.movieThumbnail,
    value.poster,
    value.poster_url,
    value.image,
    value.poster_path ? `https://image.tmdb.org/t/p/w500${value.poster_path}` : '',
  )
  const genreValue = value.genres || value.genre || value.tags || ''
  const genre = Array.isArray(genreValue) ? genreValue.join(', ') : String(genreValue || '')
  return {
    subjectId: `${source}:${sourceId}`,
    sourceId: String(sourceId),
    provider: source,
    subjectType: isSeries ? 2 : 1,
    mediaKind: forcedKind || (isSeries ? 'series' : source === 'ghibli' ? 'anime' : 'movie'),
    title: String(title),
    description: stripMarkup(firstText(value.description, value.movieDescription, value.introduction, value.summary, value.plot, '')),
    releaseDate: firstText(value.release_date, value.releaseDate, value.premiered, value.releaseYear, value.year),
    duration: firstText(value.duration, value.runtime, value.averageRuntime, ''),
    genre,
    cover,
    countryName: firstText(value.country_name, value.countryName, value.country?.name, value.network?.country?.name, ''),
    imdbRatingValue: firstText(value.imdb_rating_value, value.imdb_rating, value.imdbRating, value.rate, value.rating?.average, ''),
    imdbId: firstText(value.imdb_id, value.imdbId, value.externals?.imdb, ''),
    tmdbId: firstText(value.tmdb_id, value.tmdbId, value.tmdb, source === 'consumet' ? sourceId : ''),
    tvmazeId: source === 'tvmaze' ? String(value.id || sourceId) : firstText(value.tvmaze_id, value.tvmazeId, ''),
    hasResource: true,
  }
}

function uniqueItems(items) {
  const seen = new Set()
  return items.filter(item => {
    if (!item?.subjectId || !item.title) return false
    const key = item.provider && item.sourceId
      ? `${item.provider}:${item.sourceId}`
      : `${String(item.title).toLowerCase()}|${String(item.releaseDate || '').slice(0, 4)}|${item.subjectType}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function matchesQuery(item, query) {
  const needle = String(query || '').trim().toLowerCase()
  return !needle || `${item.title} ${item.description} ${item.genre}`.toLowerCase().includes(needle)
}

async function allInOneMovies() {
  return cached('allinone-movies', async () => itemsFrom(await fallbackJson(`${ALLINONE_BASE}/movies`)).map(item => normalizeItem(item, 'allinone')).filter(Boolean))
}

async function katMovies() {
  return cached('katdb-movies', async () => itemsFrom(await fallbackJson(`${KATDB_BASE}/movies`, {}, 15000)).map(item => normalizeItem(item, 'katdb')).filter(Boolean))
}

async function xcasperMovies() {
  return cached('xcasper-trending', async () => itemsFrom(await fallbackJson(`${XCASPER_BASE}/api/trending`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, 12000)).map(item => normalizeItem(item, 'xcasper')).filter(Boolean))
}

async function xcasperSearch(query, type = '') {
  const suffix = type ? `&type=${encodeURIComponent(type)}` : ''
  const payload = await fallbackJson(`${XCASPER_BASE}/api/search?keyword=${encodeURIComponent(query)}${suffix}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, 12000)
  const items = itemsFrom(payload).map(item => normalizeItem(item, 'xcasper')).filter(Boolean)
  return ['2', 'tv', 'series'].includes(String(type).toLowerCase()) ? items.filter(item => item.subjectType === 2) : items
}

async function ghibliMovies() {
  return cached('ghibli-films', async () => itemsFrom(await fallbackJson(`${GHIBLI_BASE}/films`)).map(item => normalizeItem(item, 'ghibli', 'anime')).filter(Boolean))
}

async function tvmazeCatalog() {
  return cached('tvmaze-catalog', async () => itemsFrom(await fallbackJson(`${TVMAZE_BASE}/shows?page=0`)).map(item => normalizeItem(item, 'tvmaze', 'series')).filter(Boolean))
}

async function tvmazeSearch(query) {
  return itemsFrom(await fallbackJson(`${TVMAZE_BASE}/search/shows?q=${encodeURIComponent(query)}`)).map(item => normalizeItem(item, 'tvmaze', 'series')).filter(Boolean)
}

async function consumetSearch(query) {
  return itemsFrom(await fallbackJson(`${CONSUMET_BASE}/search?query=${encodeURIComponent(query)}`)).map(item => normalizeItem(item, 'consumet')).filter(Boolean)
}

async function imdbSearch(query) {
  return itemsFrom(await fallbackJson(`${IMDB_PROXY_BASE}/search?q=${encodeURIComponent(query)}`)).map(item => normalizeItem(item, 'imdb')).filter(Boolean)
}

async function omdbSearch(query, series = false) {
  const key = process.env.OMDB_API_KEY
  if (!key) return []
  const url = `https://www.omdbapi.com/?apikey=${encodeURIComponent(key)}&s=${encodeURIComponent(query)}&type=${series ? 'series' : 'movie'}`
  return itemsFrom(await fallbackJson(url)).map(item => normalizeItem(item, 'omdb', series ? 'series' : '')).filter(Boolean)
}

async function apifySearch(query, series = false) {
  const token = process.env.APIFY_TOKEN
  if (!token) return []
  const url = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`
  const payload = await fallbackJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'search', query, country: 'US', count: 10, type: series ? 'series' : 'movie' }),
  }, 20000)
  return itemsFrom(payload).map(item => normalizeItem(item, 'apify', series ? 'series' : '')).filter(Boolean)
}

async function searchFallbacks(query, type = '') {
  const series = ['2', 'tv', 'series'].includes(String(type).toLowerCase())
  const loaders = series
    ? [xcasperSearch(query, type), tvmazeSearch(query), imdbSearch(query), apifySearch(query, true)]
    : [xcasperSearch(query, type), consumetSearch(query), imdbSearch(query), omdbSearch(query), apifySearch(query), allInOneMovies(), katMovies()]
  const settled = await Promise.allSettled(loaders)
  return uniqueItems(settled.flatMap(result => result.status === 'fulfilled' ? result.value : []).filter(item => matchesQuery(item, query))).slice(0, 40)
}

async function catalogFallback(action) {
  if (action.startsWith('tv-')) return (await tvmazeCatalog()).slice(0, 40)
  if (action.startsWith('anime-')) return (await ghibliMovies()).slice(0, 40)
  const settled = await Promise.allSettled([xcasperMovies(), allInOneMovies(), katMovies()])
  return uniqueItems(settled.flatMap(result => result.status === 'fulfilled' ? result.value : [])).slice(0, 40)
}

function parseRef(id) {
  const value = String(id || '')
  const separator = value.indexOf(':')
  return separator > 0 ? { provider: value.slice(0, separator), sourceId: value.slice(separator + 1) } : { provider: '', sourceId: value }
}

async function enrichMovie(movie) {
  if (!movie || movie.imdbId || movie.tmdbId || movie.tvmazeId) return movie
  const settled = await Promise.allSettled([consumetSearch(movie.title), imdbSearch(movie.title), movie.subjectType === 2 ? tvmazeSearch(movie.title) : Promise.resolve([])])
  const candidate = settled.flatMap(result => result.status === 'fulfilled' ? result.value : []).find(item => item.subjectType === movie.subjectType)
  return candidate ? { ...movie, imdbId: candidate.imdbId || '', tmdbId: candidate.tmdbId || '', tvmazeId: candidate.tvmazeId || '' } : movie
}

async function movieByRef(id, title = '', type = '') {
  const { provider, sourceId } = parseRef(id)
  let movie = null
  try {
    if (provider === 'tvmaze') movie = normalizeItem(await fallbackJson(`${TVMAZE_BASE}/shows/${encodeURIComponent(sourceId)}`), 'tvmaze', 'series')
    if (provider === 'allinone') movie = normalizeItem(await fallbackJson(`${ALLINONE_BASE}/movies/${encodeURIComponent(sourceId)}`), 'allinone')
    if (provider === 'katdb') movie = normalizeItem(await fallbackJson(`${KATDB_BASE}/movies?id=${encodeURIComponent(sourceId)}`, {}, 15000), 'katdb')
    if (provider === 'xcasper') movie = normalizeItem(await fallbackJson(`${XCASPER_BASE}/api/rich-detail?subjectId=${encodeURIComponent(sourceId)}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, 12000), 'xcasper')
    if (provider === 'ghibli') movie = normalizeItem(await fallbackJson(`${GHIBLI_BASE}/films/${encodeURIComponent(sourceId)}`), 'ghibli', 'anime')
    if (provider === 'consumet') movie = normalizeItem(await fallbackJson(`${CONSUMET_BASE}/info/${encodeURIComponent(sourceId)}`), 'consumet')
  } catch (error) {
    console.warn('[movies:fallback-detail]', provider, error.message)
  }
  if (!movie && title) movie = (await searchFallbacks(title, type || (provider === 'tvmaze' ? '2' : '')))[0] || null
  return enrichMovie(movie)
}

async function seasonDetails(movie) {
  if (!movie?.tvmazeId) return []
  try {
    const episodes = itemsFrom(await fallbackJson(`${TVMAZE_BASE}/shows/${encodeURIComponent(movie.tvmazeId)}/episodes`))
    const seasons = new Map()
    for (const episode of episodes) {
      const season = asNumber(episode?.season)
      const number = asNumber(episode?.number)
      if (!season || !number) continue
      if (!seasons.has(season)) seasons.set(season, [])
      seasons.get(season).push(number)
    }
    return [...seasons.entries()].map(([number, episodes]) => ({ number, episodes: [...new Set(episodes)].sort((a, b) => a - b) }))
  } catch (error) {
    console.warn('[movies:fallback-seasons]', error.message)
    return []
  }
}

function embedUrl(movie, season = '', episode = '') {
  if (!movie) return ''
  const series = Number(movie.subjectType) === 2 || movie.mediaKind === 'series'
  const params = new URLSearchParams()
  if (series) {
    if (movie.tmdbId && !String(movie.tmdbId).startsWith('tt')) params.set('tmdb', movie.tmdbId)
    else if (movie.tvmazeId) params.set('tvmaze', movie.tvmazeId)
    else if (movie.imdbId) params.set('imdb', movie.imdbId)
    if (!params.toString()) return ''
    params.set('season', String(season || 1))
    params.set('episode', String(episode || 1))
    return `${PRIMESRC_BASE}/embed/tv?${params.toString()}`
  }
  if (movie.imdbId) params.set('imdb', movie.imdbId)
  else if (movie.tmdbId && !String(movie.tmdbId).startsWith('tt')) params.set('tmdb', movie.tmdbId)
  return params.toString() ? `${PRIMESRC_BASE}/embed/movie?${params.toString()}` : ''
}

function xcasperStreamUrl(movie, season = '', episode = '') {
  if (movie?.provider !== 'xcasper' || !movie.sourceId) return ''
  const params = new URLSearchParams({ subjectId: movie.sourceId, resolution: '720' })
  if (season && episode) {
    params.set('se', String(season))
    params.set('ep', String(episode))
  }
  return `${XCASPER_BASE}/api/bff/stream?${params.toString()}`
}

const listBody = (items, extra = {}) => brandPublicResponse({ success: true, api: 'Toosii API', ...extra, data: { subjectList: items, items } })
const detailBody = (movie, extra = {}) => brandPublicResponse({ success: true, api: 'Toosii API', ...extra, data: movie })

export async function movieFallback({ action, q, genre = '', id, type, season, episode, title }) {
  const provider = 'Toosii Fallback'
  if (action === 'search') return { body: listBody(await searchFallbacks(q, type), { operation: 'movies.search', provider }) }
  if (action === 'suggest') return { body: brandPublicResponse({ success: true, api: 'Toosii API', operation: 'movies.suggest', provider, data: (await searchFallbacks(q, type)).slice(0, 10) }) }
  if (action === 'home') {
    const [movies, series, anime] = await Promise.allSettled([catalogFallback('movie-popular'), catalogFallback('tv-popular'), catalogFallback('anime-home')])
    const sections = [
      { title: 'Fallback Movies', items: movies.status === 'fulfilled' ? movies.value : [] },
      { title: 'Fallback Series', items: series.status === 'fulfilled' ? series.value : [] },
      { title: 'Studio Ghibli', items: anime.status === 'fulfilled' ? anime.value : [] },
    ].filter(section => section.items.length)
    return { body: brandPublicResponse({ success: true, api: 'Toosii API', operation: 'movies.home', provider, data: { sections, subjectList: sections[0]?.items || [], items: sections.flatMap(section => section.items) } }) }
  }
  if (action === 'discover') return { body: listBody((await catalogFallback('movie-popular')).filter(item => matchesQuery(item, genre || q)), { operation: 'movies.discover', provider }) }
  if (['trending', 'hot', 'movie-popular', 'movie-new', 'movie-top', 'movie-genre', 'tv-popular', 'tv-trending', 'tv-new', 'tv-genre', 'anime-trending', 'anime-browse', 'live'].includes(action)) return { body: listBody(await catalogFallback(action), { operation: 'media.' + action, provider }) }

  if (['detail', 'movie-info', 'tv-info', 'anime-info'].includes(action)) {
    const movie = await movieByRef(id, title, type)
    return movie ? { body: detailBody(movie, { operation: 'movies.detail', provider }) } : { status: 404, body: { error: 'Fallback title not found' } }
  }

  if (['play', 'seasons', 'tv-seasons'].includes(action)) {
    const movie = await movieByRef(id, title, type)
    if (!movie) return { status: 404, body: { error: 'Fallback title not found' } }
    const details = await seasonDetails(movie)
    return { body: brandPublicResponse({ success: true, api: 'Toosii API', provider, data: { isTV: movie.subjectType === 2, imdbId: movie.imdbId || null, tmdbId: movie.tmdbId || null, tvmazeId: movie.tvmazeId || null, seasons: details.map(item => item.number), seasonDetails: details, embedUrl: embedUrl(movie, season, episode), directUrl: xcasperStreamUrl(movie, season, episode), fallback: true } }) }
  }

  if (action === 'stream' || action === 'stream-meta') {
    const movie = await movieByRef(id, title, type)
    const directSource = xcasperStreamUrl(movie, season, episode)
    if (directSource) return { body: brandPublicResponse({ success: true, api: 'Toosii API', provider, data: { url: directSource, playbackUrl: directSource, urls: [directSource], directUrl: directSource, available: true, browserCompatible: true, fallback: true } }) }
    const source = embedUrl(movie, season, episode)
    if (!source) return { status: 503, body: { error: 'No fallback stream source is available for this title.' } }
    return { body: brandPublicResponse({ success: true, api: 'Toosii API', provider, data: { url: source, playbackUrl: source, urls: [source], embedUrl: source, available: true, browserCompatible: false, fallback: true } }) }
  }

  if (['movie-recommend', 'tv-recommend', 'recommend'].includes(action)) return { body: listBody([], { operation: 'movies.recommend', provider }) }
  if (['trailer', 'cast', 'dubs', 'captions', 'anime-captions', 'downloads', 'anime-downloads', 'resources'].includes(action)) return { body: brandPublicResponse({ success: true, api: 'Toosii API', provider, data: action.includes('download') || action === 'downloads' ? { files: [] } : [] }) }
  if (action === 'download' || action === 'download-check') return { status: 503, body: { error: 'Fallback provider supports embedded playback only.' } }
  return { status: 400, body: { error: 'Unknown fallback action' } }
}
