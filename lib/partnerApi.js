/*
 * Partner API client — a free, key-less REST collection (16 categories,
 * 600+ endpoints) used as fallback/secondary providers behind the site's
 * primary data sources.
 *
 * Every `partner*` normalizer below resolves to `null` when the upstream
 * fails, returns an error payload, or gives back empty data — so routes can
 * chain them directly behind their primary providers as fallbacks:
 *
 *   const primary = await tryPrimary()
 *   if (primary) return primary
 *   const partner = await partnerLyrics(q)
 *   if (partner) return NextResponse.json(partner)
 *
 * Base URL: PARTNER_API_BASE env var, or the built-in default (base64
 * encoded below so no raw host strings sit in plain text in the repo).
 */

const DEFAULT_BASE = atob('aHR0cHM6Ly9hcGlza2VpdGgyLXByb2R1Y3Rpb24tMzY3OS51cC5yYWlsd2F5LmFwcA==')

export const PARTNER_API_BASE = (process.env.PARTNER_API_BASE || DEFAULT_BASE).replace(/\/+$/, '')
export const PARTNER_API_NAME = 'Toosii API'

export function firstText(...values) {
  return values.find(value => value !== undefined && value !== null && String(value).trim() !== '') || ''
}

function partnerUrl(path, params = {}) {
  const url = new URL(PARTNER_API_BASE + path)
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === '') continue
    url.searchParams.set(key, String(value))
  }
  return url
}

/*
 * Fetch a Partner endpoint and parse JSON.
 * Returns the full payload, or null on any failure (network, non-2xx,
 * invalid JSON, or an explicit `status: false` error payload).
 * When `raw` is true the response is returned as { buffer, contentType }
 * regardless of content type — used for image endpoints.
 */
export async function partnerFetch(path, { params, timeout = 15000, headers = {}, raw = false } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(partnerUrl(path, params).toString(), {
      headers: { Accept: raw ? '*/*' : 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; ToosiiTechWeb/1.0)', ...headers },
      signal: controller.signal,
    })
    if (!response.ok) return null

    const contentType = response.headers.get('content-type') || ''
    if (raw) {
      const buffer = new Uint8Array(await response.arrayBuffer())
      if (!buffer.length) return null
      return { buffer, contentType }
    }

    if (!contentType.includes('application/json')) {
      const text = await response.text().catch(() => '')
      try { return JSON.parse(text) } catch { return null }
    }

    const payload = await response.json().catch(() => null)
    if (!payload || payload.status === false) return null
    return payload
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function bytesToBase64(bytes) {
  const chunks = []
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + chunkSize)))
  }
  return btoa(chunks.join(''))
}

export async function fetchImageBytes(imageUrl, timeout = 30000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(imageUrl, {
      headers: { Accept: 'image/*' },
      signal: controller.signal,
    })
    const contentType = response.headers.get('content-type') || ''
    if (!response.ok || !contentType.startsWith('image/')) return null
    const buffer = new Uint8Array(await response.arrayBuffer())
    if (!buffer.length) return null
    return { buffer, contentType: contentType.split(';')[0] }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/* Pull a usable image URL out of the many shapes Partner endpoints return. */
function extractImageUrl(result) {
  if (!result) return null
  if (typeof result === 'string') return /^https?:\/\//i.test(result.trim()) ? result.trim() : null
  const candidates = [
    result.url, result.image, result.imageUrl, result.image_url, result.download,
    result.src, result.data, result.result, result.image_url_h, result.hires, result.photo,
  ]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && /^https?:\/\//i.test(candidate.trim())) return candidate.trim()
    if (candidate && typeof candidate === 'object') {
      const nested = extractImageUrl(candidate)
      if (nested) return nested
    }
  }
  return null
}

/* ───────────────────────────── Lyrics ───────────────────────────── */

export async function partnerLyrics(query) {
  for (const path of ['/search/lyrics', '/search/lyrics2', '/search/lyrics3']) {
    const payload = await partnerFetch(path, { params: { query }, timeout: 20000 })
    const list = Array.isArray(payload?.result) ? payload.result : []
    const hit = list.find(item => item?.lyrics && String(item.lyrics).trim()) || list[0]
    if (hit?.lyrics) {
      return {
        track: firstText(hit.song, hit.track, query).slice(0, 200),
        artist: firstText(hit.artist).slice(0, 120) || null,
        album: firstText(hit.album).slice(0, 120) || null,
        duration: firstText(hit.duration).slice(0, 20) || null,
        lyrics: String(hit.lyrics).slice(0, 12000),
      }
    }
  }
  return null
}

/* ───────────────────────────── Fun ───────────────────────────── */

export async function partnerJoke() {
  const payload = await partnerFetch('/fun/jokes')
  const joke = payload?.result
  if (!joke?.setup) return null
  return { type: 'general', setup: String(joke.setup), punchline: firstText(joke.punchline) }
}

export async function partnerMeme() {
  const payload = await partnerFetch('/fun/meme')
  if (!payload?.url || payload.nsfw) return null
  return { url: payload.url, subreddit: firstText(payload.subreddit), title: firstText(payload.title), postLink: firstText(payload.postLink) }
}

/* ───────────────────────────── News ───────────────────────────── */

export const PARTNER_NEWS_SOURCES = {
  bbc: 'BBC News',
  ntv: 'NTV Kenya',
  citizen: 'Citizen Digital',
  kbc: 'KBC Channel 1',
  tech: 'Tech News',
  kenyans: 'Kenyans.co.ke',
}

export async function partnerNews(source = 'bbc') {
  const payload = await partnerFetch(`/news/${source}`, { timeout: 20000 })
  const articles = (Array.isArray(payload?.result?.articles) ? payload.result.articles : [])
    .map(article => ({
      title: firstText(article.title, article.headline),
      url: firstText(article.link, article.url),
      description: firstText(article.summary, article.description),
      publishedAt: firstText(article.timePosted, article.publishedAt),
      imageUrl: firstText(article.imageUrl, article.image),
    }))
    .filter(article => article.title && article.url)
  if (!articles.length) return null
  return { sourceName: PARTNER_NEWS_SOURCES[source] || source, articles }
}

/* ───────────────────────────── Books ───────────────────────────── */

export async function partnerBooks(query) {
  const payload = await partnerFetch('/education/booksearch', { params: { q: query }, timeout: 20000 })
  const list = Array.isArray(payload?.result)
    ? payload.result
    : [payload?.result?.books, payload?.result?.results, payload?.result?.data].find(Array.isArray) || []
  const results = list
    .map(book => ({
      key: firstText(book.id, book.book_id, book.isbn) || null,
      title: firstText(book.title, book.name) || 'Untitled',
      authors: Array.isArray(book.authors) ? book.authors : firstText(book.author, book.authors) ? [firstText(book.author, book.authors)] : [],
      firstPublishYear: book.year ? Number(book.year) : null,
      editionCount: 0,
      languages: [],
      coverUrl: firstText(book.cover, book.image, book.thumbnail, book.cover_url) || null,
      description: firstText(book.description, book.summary) || null,
      link: firstText(book.link, book.url) || null,
    }))
    .filter(book => book.title)
  if (!results.length) return null
  return results
}

/* ───────────────────────────── APK search ───────────────────────────── */

export async function partnerApk(query) {
  const payload = await partnerFetch('/search/apk', { params: { q: query }, timeout: 20000 })
  const list = Array.isArray(payload?.result) ? payload.result : []
  const apps = list
    .map(app => ({
      name: firstText(app.title, app.name) || 'Unknown App',
      package: firstText(app.package, app.packageName) || '',
      version: firstText(app.version, app.vername) || '',
      size: firstText(app.size, app.filesize) || '',
      download: firstText(app.link, app.download, app.url) || '',
      icon: firstText(app.image, app.icon) || '',
      developer: firstText(app.developer) || '',
    }))
    .filter(app => app.name)
  if (!apps.length) return null
  return apps
}

/* ───────────────────────────── Temp mail ───────────────────────────── */

export async function partnerTempEmail() {
  const payload = await partnerFetch('/tempmail', { timeout: 12000 })
  const email = firstText(
    typeof payload?.result === 'string' ? payload.result : null,
    payload?.result?.email,
    payload?.result?.address,
    payload?.email,
  )
  return email.includes('@') ? email : null
}

/* ───────────────────────────── Media search ───────────────────────────── */

export async function partnerYouTubeSearch(query) {
  const payload = await partnerFetch('/search/yts', { params: { query }, timeout: 20000 })
  const list = Array.isArray(payload?.result) ? payload.result : []
  const results = list
    .map(video => ({
      id: firstText(video.id),
      title: firstText(video.title),
      url: firstText(video.url, video.id ? `https://youtu.be/${video.id}` : ''),
      thumbnail: firstText(video.thumbnail, video.id ? `https://img.youtube.com/vi/${video.id}/hqdefault.jpg` : ''),
      duration: firstText(video.duration).replace(/^\d+ seconds \((.+)\)$/, '$1'),
      channel: firstText(video.channel, video.author) || '',
      views: firstText(video.views) ? `${video.views} views` : '',
      uploaded: firstText(video.published) || '',
    }))
    .filter(video => video.id && video.title)
  if (!results.length) return null
  return results
}

export async function partnerSpotifySearch(query) {
  const payload = await partnerFetch('/search/spotify', { params: { q: query }, timeout: 20000 })
  const list = Array.isArray(payload?.result) ? payload.result : []
  const results = list
    .map(track => ({
      id: firstText(track.id),
      title: firstText(track.title),
      artist: firstText(track.artist),
      album: firstText(track.album) || '',
      cover: firstText(track.thumb, track.cover, track.thumbnail) || '',
      duration: firstText(track.duration) || 0,
      preview: '',
      link: firstText(track.url) || '',
      explicit: false,
    }))
    .filter(track => track.id && track.title)
  if (!results.length) return null
  return results
}

/* ───────────────────────────── Movie search ───────────────────────────── */

export async function partnerMovieSearch(query) {
  const payload = await partnerFetch('/moviebox/search', { params: { q: query }, timeout: 20000 })
  const list = payload?.result?.results || []
  const results = list
    .map((item, index) => {
      const title = firstText(item.title)
      const url = firstText(item.url)
      const slug = url.split('/').pop() || `partner-${index}`
      const isSeries = /series|tv/i.test(String(item.type || ''))
      const rating = Number.parseFloat(String(item.rating || ''))
      return {
        subjectId: `partner:${slug}`,
        subjectType: isSeries ? 2 : 1,
        mediaKind: isSeries ? 'series' : 'movie',
        title,
        description: '',
        releaseDate: '',
        duration: '',
        genre: '',
        cover: '',
        countryName: '',
        imdbRatingValue: Number.isFinite(rating) && rating > 0 ? String(rating) : '',
        language: [],
        contentRating: '',
        hasResource: false,
        externalUrl: url,
      }
    })
    .filter(item => item.title)
  if (!results.length) return null
  return results
}

/* ───────────────────────────── AI chat ───────────────────────────── */

function extractChatText(result) {
  if (!result) return ''
  if (typeof result === 'string') return result.trim()
  const candidates = [
    result.response, result.answer, result.message, result.text, result.result,
    result.output, result.content,
    result?.data?.response, result?.data?.answer, result?.data?.message, result?.data?.text,
    result?.choices?.[0]?.message?.content, result?.choices?.[0]?.text,
  ]
  const value = candidates.find(item => typeof item === 'string' && item.trim())
  return value ? value.trim() : ''
}

export async function partnerChat(prompt) {
  const endpoints = [
    { path: '/partnerai', param: 'q', label: 'AI' },
    { path: '/ai/gpt', param: 'q', label: 'GPT' },
    { path: '/ai/qwenai', param: 'q', label: 'Qwen' },
    { path: '/ai/deepseekV3', param: 'q', label: 'DeepSeek V3' },
  ]
  for (const endpoint of endpoints) {
    const payload = await partnerFetch(endpoint.path, { params: { [endpoint.param]: prompt.slice(0, 7200) }, timeout: 40000 })
    const text = extractChatText(payload?.result)
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<\/?think>/gi, '')
      .trim()
    if (text) return { reply: text, model: `Partner ${endpoint.label}` }
  }
  return null
}

/* ───────────────────────────── AI images ───────────────────────────── */

export async function resolveGeneratedImage(result) {
  if (!result) return null
  if (typeof result === 'string') {
    if (result.startsWith('data:image')) return { image: result }
    if (/^https?:\/\//i.test(result)) {
      const bytes = await fetchImageBytes(result)
      if (bytes) return { image: `data:${bytes.contentType};base64,${bytesToBase64(bytes.buffer)}`, contentType: bytes.contentType }
    }
    return null
  }
  if (typeof result === 'object') {
    const dataUrl = firstText(result.image, result.dataUrl, result.data_url, result.result)
    if (dataUrl.startsWith('data:image')) return { image: dataUrl }
    const url = extractImageUrl(result)
    if (url) {
      const bytes = await fetchImageBytes(url)
      if (bytes) return { image: `data:${bytes.contentType};base64,${bytesToBase64(bytes.buffer)}`, contentType: bytes.contentType }
    }
  }
  return null
}

export async function partnerImageGeneration(prompt) {
  const attempts = [
    { path: '/ai/flux', params: { q: prompt } },
    { path: '/ai/magicstudio', params: { prompt } },
    { path: '/ai/text2img', params: { q: prompt } },
  ]
  for (const attempt of attempts) {
    const payload = await partnerFetch(attempt.path, { params: attempt.params, timeout: 45000 })
    const image = await resolveGeneratedImage(payload?.result)
    if (image?.image) return image
  }
  return null
}

export async function partnerRemoveBackground(imageUrl) {
  const payload = await partnerFetch('/ai/removebg', { params: { url: imageUrl }, timeout: 45000, raw: true })
  if (!payload) return null
  if (payload.buffer) {
    const isImage = (payload.contentType || '').startsWith('image/')
    if (isImage) return { buffer: payload.buffer, contentType: payload.contentType.split(';')[0] }
  }
  const url = extractImageUrl(payload)
  if (url) return fetchImageBytes(url)
  return null
}

/* ───────────────────────────── Sports ───────────────────────────── */

const PARTNER_LEAGUES = {
  'eng.1': { code: 'epl', name: 'English Premier League' },
  'esp.1': { code: 'laliga', name: 'Spanish La Liga' },
  'ita.1': { code: 'seriea', name: 'Italian Serie A' },
  'ger.1': { code: 'bundesliga', name: 'German Bundesliga' },
  'fra.1': { code: 'ligue1', name: 'French Ligue 1' },
  'uefa.champions': { code: 'ucl', name: 'UEFA Champions League' },
}

export const PARTNER_LEAGUE_LIST = Object.entries(PARTNER_LEAGUES).map(([key, value]) => ({ code: value.code, name: value.name }))

function parseScore(score) {
  const parts = String(score || '').split('-').map(part => Number.parseInt(part.trim(), 10))
  if (parts.length !== 2 || parts.some(part => !Number.isFinite(part))) return [null, null]
  return parts
}

function mapMatchStatus(status) {
  const value = String(status || '').trim().toUpperCase()
  if (['FINISHED', 'FT', 'AET', 'PEN'].includes(value)) return { state: 'finished', detail: 'Full time', completed: true }
  if (['LIVE', 'IN', '1T', '2T', 'HT', 'BT', 'ET'].includes(value)) return { state: 'in', detail: { '1T': '1st half', '2T': '2nd half', HT: 'Half time', BT: 'Break time', ET: 'Extra time' }[value] || 'Live', completed: false }
  if (['POSTPONED', 'CANC', 'ABD', 'SUSP'].includes(value)) return { state: 'postponed', detail: value, completed: false }
  return { state: 'scheduled', detail: 'Scheduled', completed: false }
}

function partnerMatchEvent(leagueCode, index, match) {
  const status = mapMatchStatus(match.status)
  const [homeScore, awayScore] = parseScore(match.score)
  return {
    id: `partner-${leagueCode}-${index}`,
    name: `${match.homeTeam} vs ${match.awayTeam}`,
    shortName: `${String(match.homeTeam || '').slice(0, 3)}-${String(match.awayTeam || '').slice(0, 3)}`,
    date: match.date || '',
    status,
    venue: null,
    teams: [
      { id: null, name: match.homeTeam, abbreviation: null, logo: null, homeAway: 'home', score: homeScore, winner: Boolean(match.winner) && match.winner !== 'Draw' && String(match.winner) === String(match.homeTeam) },
      { id: null, name: match.awayTeam, abbreviation: null, logo: null, homeAway: 'away', score: awayScore, winner: Boolean(match.winner) && match.winner !== 'Draw' && String(match.winner) === String(match.awayTeam) },
    ],
  }
}

/* ESPN-shaped scoreboard from a Partner league `matches` endpoint. */
export async function partnerLeagueMatches(leagueKey) {
  const league = PARTNER_LEAGUES[leagueKey]
  if (!league) return null
  const payload = await partnerFetch(`/${league.code}/matches`, { timeout: 20000 })
  const matches = payload?.result?.matches
  if (!Array.isArray(matches) || !matches.length) return null
  return {
    competition: firstText(payload.result.competition, league.name),
    events: matches.map((match, index) => partnerMatchEvent(league.code, index, match)),
  }
}

const PARTNER_LIVE_LEAGUES = {
  15: 'English Premier League',
  14: 'Spanish La Liga',
  13: 'Italian Serie A',
  12: 'French Ligue 1',
  11: 'German Bundesliga',
}

/* All currently listed matches from Partner's LiveScore feed, grouped by league. */
export async function partnerLiveScores() {
  const payload = await partnerFetch('/livescore', { timeout: 25000 })
  const games = payload?.result?.games
  if (!games || typeof games !== 'object') return null

  const groups = new Map()
  for (const game of Object.values(games)) {
    if (!game?.p1 || !game?.p2) continue
    const leagueCode = String(game.cm ?? 'unknown')
    const leagueName = PARTNER_LIVE_LEAGUES[Number(leagueCode)] || `League ${leagueCode}`
    const [homeScore, awayScore] = [Number.parseInt(game?.R?.r1, 10), Number.parseInt(game?.R?.r2, 10)]
    const statusText = String(game?.R?.st || '').trim().toUpperCase()
    const status = {
      state: ['FT', 'AET', 'PEN'].includes(statusText) ? 'finished' : ['1T', '2T', 'HT', 'BT', 'IN'].includes(statusText) ? 'in' : 'scheduled',
      detail: { FT: 'Full time', '1T': '1st half', '2T': '2nd half', HT: 'Half time', BT: 'Break time' }[statusText] || (statusText ? statusText : 'Scheduled'),
      clock: null,
      completed: statusText === 'FT' || statusText === 'AET' || statusText === 'PEN',
    }
    const match = {
      id: `partner-live-${game.id}`,
      name: `${game.p1} vs ${game.p2}`,
      date: game.dt || '',
      kickoff: game.tm || '',
      status,
      teams: [
        { id: null, name: game.p1, homeAway: 'home', score: Number.isFinite(homeScore) ? homeScore : null },
        { id: null, name: game.p2, homeAway: 'away', score: Number.isFinite(awayScore) ? awayScore : null },
      ],
    }
    if (!groups.has(leagueCode)) groups.set(leagueCode, { league: leagueName, matches: [] })
    groups.get(leagueCode).matches.push(match)
  }

  const leagues = [...groups.values()]
    .map(group => ({ ...group, matchCount: group.matches.length }))
    .sort((a, b) => b.matchCount - a.matchCount)
  if (!leagues.length) return null
  return { leagues, totalMatches: leagues.reduce((sum, league) => sum + league.matchCount, 0) }
}

/* ───────────────────────────── Everyday tools ───────────────────────────── */

const PARTNER_SHORTENERS = ['tinyurl', 'vgd', 'random', 'dagd', 'bitly']

export async function partnerShorten(url, service, alias) {
  const order = service && PARTNER_SHORTENERS.includes(service)
    ? [service, ...PARTNER_SHORTENERS.filter(item => item !== service)]
    : PARTNER_SHORTENERS
  for (const code of order) {
    const params = { url }
    if (alias && ['dagd', 'vgd', 'random'].includes(code)) params.name = alias
    const payload = await partnerFetch(`/shortener/${code}`, { params, timeout: 20000 })
    const result = payload?.result
    const shortened = firstText(
      typeof result === 'string' ? result : null,
      result?.shortened, result?.url, result?.shortUrl, result?.result,
    )
    if (/^https?:\/\//i.test(shortened)) {
      return { original: url, shortened, service: code, info: firstText(result?.info) || null }
    }
  }
  return null
}

export async function partnerFancyText(text, style) {
  if (style === 'random') {
    const randomPayload = await partnerFetch('/fancytext/random', { params: { q: text } })
    const value = firstText(randomPayload?.result, randomPayload?.text)
    if (!value) return null
    return { input: text, style: String(randomPayload?.style ?? 'random'), result: value }
  }

  const params = { q: text }
  if (style !== undefined && style !== null && style !== '') params.style = style
  const payload = await partnerFetch('/fancytext', { params })
  const result = firstText(payload?.result, payload?.text)
  if (!result) return null
  return { input: text, style: style && style !== '' ? String(style) : String(payload?.style ?? ''), result }
}

export async function partnerFancyStyles(text) {
  const payload = await partnerFetch('/fancytext/styles', { params: { q: text } })
  const styles = Array.isArray(payload?.styles) ? payload.styles : []
  if (!styles.length) return null
  return styles.map((style, index) => ({ index, name: firstText(style.name) || `Style ${index + 1}`, result: firstText(style.result) }))
}

export async function partnerTranslate(text, to) {
  const payload = await partnerFetch('/translate', { params: { text, to }, timeout: 20000 })
  const result = payload?.result
  const translated = firstText(typeof result === 'string' ? result : null, result?.translatedText, result?.translation, result?.text)
  if (!translated) return null
  return {
    originalText: firstText(result?.originalText, text),
    translatedText: translated,
    targetLanguage: firstText(result?.targetLanguage, to),
  }
}

function isValidCurrency(code) {
  return /^[A-Za-z]{3}$/.test(String(code || '').trim())
}

/* Partner reports USD-based rates; cross-convert through USD. */
export async function partnerCurrencyConversion(amount, from, to) {
  if (!isValidCurrency(from) || !isValidCurrency(to)) return null
  const fromCode = from.toUpperCase()
  const toCode = to.toUpperCase()
  const [fromPayload, toPayload] = await Promise.all([
    partnerFetch('/finance/exchange', { params: { q: fromCode } }),
    partnerFetch('/finance/exchange', { params: { q: toCode } }),
  ])
  const fromRate = Number(fromPayload?.result?.rate)
  const toRate = Number(toPayload?.result?.rate)
  if (!Number.isFinite(fromRate) || fromRate <= 0 || !Number.isFinite(toRate) || toRate <= 0) return null

  const value = Number.isFinite(amount) && amount > 0 ? amount : 1
  const converted = (value / fromRate) * toRate
  return {
    amount: value,
    from: fromCode,
    to: toCode,
    rate: converted / value,
    converted: Math.round(converted * 100) / 100,
    date: firstText(toPayload.result.date, fromPayload.result.date) || new Date().toISOString().slice(0, 10),
  }
}

export async function partnerBibleSearch(query) {
  const payload = await partnerFetch('/search/bible', { params: { q: query }, timeout: 20000 })
  const result = payload?.result
  if (!result) return null
  const text = firstText(result.text, ...(result.verses || []).map(verse => verse.text))
  if (!text) return null
  return {
    reference: firstText(result.reference, query),
    translation: result.translation?.name ? { name: result.translation.name, note: firstText(result.translation.note) } : null,
    verses: (result.verses || []).map(verse => ({
      book: firstText(verse.book),
      chapter: verse.chapter ?? null,
      verse: verse.verse ?? null,
      text: firstText(verse.text),
    })),
    text,
  }
}

export async function partnerDictionary(word) {
  const payload = await partnerFetch('/education/dictionary', { params: { q: word }, timeout: 20000 })
  const result = payload?.result
  if (!result?.word || !Array.isArray(result.meanings)) return null
  return {
    word: String(result.word),
    phonetics: (result.phonetics || []).map(item => ({
      text: firstText(item.text),
      audio: firstText(item.audio) || null,
    })),
    meanings: result.meanings.map(meaning => ({
      partOfSpeech: firstText(meaning.partOfSpeech),
      definitions: (meaning.definitions || []).map(definition => ({
        definition: firstText(definition.definition),
        synonyms: Array.isArray(definition.synonyms) ? definition.synonyms : [],
        antonyms: Array.isArray(definition.antonyms) ? definition.antonyms : [],
        example: firstText(definition.example) || null,
      })).filter(definition => definition.definition),
    })).filter(meaning => meaning.definitions.length),
  }
}

export async function partnerKnec(indexNumber, name) {
  const payload = await partnerFetch('/tools/knec', { params: { index: indexNumber, name }, timeout: 30000 })
  const result = payload?.result
  if (!result) return null
  return { index: String(indexNumber), name: String(name), result }
}
