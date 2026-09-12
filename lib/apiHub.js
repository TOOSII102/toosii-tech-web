/*
 * API Hub client — a free multi-provider hub (900+ endpoints) used as a
 * second fallback layer behind the Partner API.
 *
 * Works out of the box: the hub publishes a shared community key (a few
 * requests per day, shared globally) so no registration or payment is
 * needed. Set HUB_API_KEY to a free personal key to raise the daily
 * allowance. Personal keys are secret — they are only ever sent
 * server-side in the request, never to the browser.
 *
 * Every `hub*` normalizer below resolves to `null` when the upstream fails,
 * returns an error payload, or the daily allowance is exhausted — so routes
 * can chain them directly behind their existing fallbacks:
 *
 *   const partner = await partnerChat(prompt)
 *   if (partner) return partner
 *   const hub = await hubChat(prompt)
 *   if (hub) return hub
 *
 * A lightweight circuit breaker stops hammering the hub right after it
 * reports its daily limit is spent (or it is unreachable), keeping the
 * shared community key fair for everyone.
 *
 * Base URLs below are base64 encoded so no raw host strings sit in plain
 * text in the repo (same convention as lib/partnerApi.js).
 */

import { firstText, fetchImageBytes, resolveGeneratedImage } from './partnerApi.js'

const DEFAULT_BASE = atob('aHR0cHM6Ly9hcGl4LndvbHZhcmV4LmNvbQ==')
const SECONDARY_BASE = atob('aHR0cHM6Ly9hcGlzLnh3b2xmLnNwYWNl')
const SHARED_KEY = atob('d3hhX2RfdGVzdA==')

export const HUB_API_BASE = (process.env.HUB_API_BASE || DEFAULT_BASE).replace(/\/+$/, '')
export const HUB_API_NAME = 'Toosii Hub'

const HUB_KEY = (process.env.HUB_API_KEY || SHARED_KEY).trim()

/* ───────────────────────────── circuit breaker ───────────────────────────── */

const HUB_FAILURE_COOLDOWN = 15 * 60 * 1000
const HUB_LIMIT_COOLDOWN = 60 * 60 * 1000

const hubState = globalThis.__toosiiHubState || (globalThis.__toosiiHubState = {
  openUntil: 0,
})

function isHubCircuitOpen() {
  return Date.now() < hubState.openUntil
}

function openHubCircuit(milliseconds) {
  hubState.openUntil = Math.max(hubState.openUntil, Date.now() + milliseconds)
}

/* ───────────────────────────── fetch ───────────────────────────── */

function hubUrl(base, path, params = {}) {
  const url = new URL(base + path)
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === '') continue
    url.searchParams.set(key, String(value))
  }
  url.searchParams.set('key', HUB_KEY)
  return url
}

async function hubRequest(base, path, { timeout = 15000, headers = {}, raw = false } = {}, params = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(hubUrl(base, path, params).toString(), {
      headers: { Accept: raw ? '*/*' : 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; ToosiiTechWeb/1.0)', ...headers },
      signal: controller.signal,
    })
    if (!response.ok) return { status: response.status, payload: null, rawBody: null, contentType: '' }

    const contentType = response.headers.get('content-type') || ''
    if (raw) {
      const buffer = new Uint8Array(await response.arrayBuffer())
      if (!buffer.length) return { status: response.status, payload: null, rawBody: null, contentType: '' }
      return { status: response.status, payload: null, rawBody: buffer, contentType }
    }

    const text = await response.text().catch(() => '')
    let payload = null
    if (text) {
      try { payload = JSON.parse(text) } catch { payload = null }
    }
    return { status: response.status, payload, rawBody: null, contentType }
  } catch {
    return { status: 0, payload: null, rawBody: null, contentType: '' }
  } finally {
    clearTimeout(timer)
  }
}

/*
 * Fetch a hub endpoint. Returns the full payload, or null on any failure.
 * Tries the secondary host once if the primary host is unreachable.
 * `success: false` payloads are treated as failures (null).
 */
export async function hubFetch(path, { params, timeout = 15000, headers = {}, raw = false } = {}) {
  if (isHubCircuitOpen()) return null

  const attempts = [HUB_API_BASE, SECONDARY_BASE].filter((item, index, list) => list.indexOf(item) === index)
  for (const base of attempts) {
    const { status, payload, rawBody, contentType } = await hubRequest(base, path, { timeout, headers, raw }, params)

    if (status === 0) continue // host unreachable — try the secondary

    if (raw) {
      if (rawBody) return { buffer: rawBody, contentType }
      continue // not an image — try the secondary once
    }

    if (payload && payload.success === false) {
      // Both hosts share the same daily counter, so a rate-limit error is
      // final for the day: stop calling and be fair with the shared key.
      if (/limit|daily|quota|exceeded|too many/i.test(String(payload.error || ''))) {
        openHubCircuit(HUB_LIMIT_COOLDOWN)
        return null
      }
      continue // app-level 4xx — the secondary host may still work
    }

    if (!payload) {
      if (status >= 500) openHubCircuit(HUB_FAILURE_COOLDOWN)
      continue // 5xx or unparseable body — try the secondary once
    }
    return payload
  }
  return null
}

/* ───────────────────────────── AI chat ───────────────────────────── */

function extractHubChatText(result) {
  if (!result) return ''
  if (typeof result === 'string') return result.trim()
  const candidates = [
    result.response, result.answer, result.message, result.text, result.result,
    result.output, result.content, result.reply,
    result?.data?.response, result?.data?.answer, result?.data?.message, result?.data?.text,
    result?.choices?.[0]?.message?.content, result?.choices?.[0]?.text,
  ]
  const value = candidates.find(item => typeof item === 'string' && item.trim())
  return value ? value.trim() : ''
}

export async function hubChat(prompt) {
  const endpoints = [
    { path: '/api/v1/ai/gpt4o', param: 'q', label: 'GPT' },
    { path: '/api/v1/ai/deepseek', param: 'q', label: 'DeepSeek' },
    { path: '/api/v1/ai/qwen', param: 'q', label: 'Qwen' },
    { path: '/api/v1/ai/gemini', param: 'q', label: 'Gemini' },
  ]
  for (const endpoint of endpoints) {
    const payload = await hubFetch(endpoint.path, { params: { [endpoint.param]: prompt.slice(0, 7200) }, timeout: 40000 })
    const text = extractHubChatText(payload?.result ?? payload)
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<\/?think>/gi, '')
      .trim()
    if (text) return { reply: text, model: 'Toosii AI' }
  }
  return null
}

/* ───────────────────────────── AI images ───────────────────────────── */

export async function hubImageGeneration(prompt) {
  const attempts = [
    { path: '/api/v1/ai/flux', params: { q: prompt } },
    { path: '/api/v1/ai/dalle3', params: { prompt, q: prompt } },
    { path: '/api/v1/ai/ideogram', params: { q: prompt } },
    { path: '/api/v1/ai/bing', params: { q: prompt } },
  ]
  for (const attempt of attempts) {
    const payload = await hubFetch(attempt.path, { params: attempt.params, timeout: 45000 })
    const image = await resolveGeneratedImage(payload?.result ?? payload)
    if (image?.image) return image
  }
  return null
}

/* ───────────────────────────── Background removal ───────────────────────────── */

export async function hubRemoveBackground(imageUrl) {
  for (const path of ['/api/v1/ai/removebg', '/api/v1/photo/removebg']) {
    const payload = await hubFetch(path, { params: { url: imageUrl }, timeout: 45000, raw: true })
    if (payload?.buffer) {
      const isImage = (payload.contentType || '').startsWith('image/')
      if (isImage) return { buffer: payload.buffer, contentType: payload.contentType.split(';')[0] }
    }
  }
  return null
}

/* ───────────────────────────── Lyrics ───────────────────────────── */

export async function hubLyrics(query) {
  for (const path of ['/api/v1/lyrics', '/api/v1/music/lyrics']) {
    const payload = await hubFetch(path, { params: { q: query }, timeout: 20000 })
    const result = payload?.result ?? payload
    const candidates = Array.isArray(result) ? result
      : Array.isArray(result?.results) ? result.results
      : [result]
    const hit = candidates.find(item => item && typeof item === 'object' && item.lyrics && String(item.lyrics).trim())
    if (hit?.lyrics) {
      return {
        track: firstText(hit.song, hit.track, hit.title, query).slice(0, 200),
        artist: firstText(hit.artist).slice(0, 120) || null,
        album: firstText(hit.album).slice(0, 120) || null,
        duration: firstText(hit.duration).slice(0, 20) || null,
        lyrics: String(hit.lyrics).slice(0, 12000),
      }
    }
  }
  return null
}

/* ───────────────────────────── Movies ───────────────────────────── */

export async function hubMovieSearch(query) {
  const attempts = [
    { path: '/api/v1/movies/search', params: { q: query } },
    { path: '/api/v1/tmdb/search', params: { q: query } },
    { path: '/api/v1/tmdb/movies', params: { q: query } },
  ]
  for (const attempt of attempts) {
    const payload = await hubFetch(attempt.path, { params: attempt.params, timeout: 20000 })
    const root = payload?.result ?? payload
    const list = Array.isArray(root) ? root : Array.isArray(root?.results) ? root.results : Array.isArray(root?.data) ? root.data : []
    const results = list
      .map((item, index) => {
        const title = firstText(item.title, item.name)
        const isSeries = /series|tv/i.test(String(item.media_type || item.type || ''))
        const posterPath = firstText(item.poster_path, item.poster)
        const cover = /^https?:\/\//i.test(posterPath)
          ? posterPath
          : posterPath ? `https://image.tmdb.org/t/p/w500${posterPath.startsWith('/') ? '' : '/'}${posterPath}` : ''
        const rating = Number.parseFloat(String(item.vote_average ?? item.rating ?? ''))
        const externalUrl = firstText(item.url, item.id ? `https://www.themoviedb.org/${isSeries ? 'tv' : 'movie'}/${item.id}` : '')
        return {
          subjectId: `hub:${firstText(item.imdb_id, item.id, `movie-${index}`)}`,
          subjectType: isSeries ? 2 : 1,
          mediaKind: isSeries ? 'series' : 'movie',
          title,
          description: firstText(item.overview, item.description),
          releaseDate: firstText(item.release_date, item.first_air_date, item.year),
          duration: '',
          genre: Array.isArray(item.genres) ? item.genres.map(genre => genre.name || genre).join(', ') : firstText(item.genre),
          cover,
          countryName: '',
          imdbRatingValue: Number.isFinite(rating) && rating > 0 ? String(rating) : '',
          language: [],
          contentRating: firstText(item.adult ? '16+' : ''),
          hasResource: false,
          externalUrl,
        }
      })
      .filter(item => item.title)
    if (results.length) return results
  }
  return null
}

/* ───────────────────────────── Sports ───────────────────────────── */

function hubMatchStatus(statusText) {
  const value = String(statusText || '').trim().toUpperCase()
  if (['FT', 'FINISHED', 'AET', 'PEN', 'DONE'].includes(value)) {
    return { state: 'finished', detail: 'Full time', clock: null, completed: true }
  }
  if (['1T', '2T', 'HT', 'BT', 'IN', 'LIVE', 'ET'].includes(value)) {
    return { state: 'in', detail: { '1T': '1st half', '2T': '2nd half', HT: 'Half time', BT: 'Break time', ET: 'Extra time' }[value] || 'Live', clock: null, completed: false }
  }
  if (['POSTPONED', 'CANC', 'ABD', 'SUSP', 'CANCELLED'].includes(value)) {
    return { state: 'postponed', detail: value, clock: null, completed: false }
  }
  return { state: 'scheduled', detail: 'Scheduled', clock: null, completed: false }
}

export async function hubLiveScores() {
  const attempts = ['/api/v1/sports/live', '/api/v1/sports/scores', '/api/v1/scores']
  for (const path of attempts) {
    const payload = await hubFetch(path, { timeout: 25000 })
    const root = payload?.result ?? payload
    if (!root || typeof root !== 'object') continue

    // Object map keyed by match id (p1/p2 shape) — like the Partner feed.
    const mapGames = Object.values(root).filter(item => item && typeof item === 'object' && (item.p1 || item.home))
    if (mapGames.length) {
      const groups = new Map()
      for (const game of mapGames) {
        const home = firstText(game.p1, game.home, game.homeTeam)
        const away = firstText(game.p2, game.away, game.awayTeam)
        if (!home || !away) continue
        const leagueCode = String(game.cm ?? game.league ?? game.competition ?? 'unknown')
        const status = hubMatchStatus(game.R?.st ?? game.status)
        const groupsList = groups.get(leagueCode) || {
          league: firstText(game.leagueName, game.competition, game.cmName, `League ${leagueCode}`),
          matches: [],
        }
        const homeScore = Number.parseInt(game.R?.r1 ?? game.homeScore ?? game.hs, 10)
        const awayScore = Number.parseInt(game.R?.r2 ?? game.awayScore ?? game.as, 10)
        groupsList.matches.push({
          id: `hub-live-${game.id ?? `${home}-${away}`}`,
          name: `${home} vs ${away}`,
          date: firstText(game.dt, game.date),
          kickoff: firstText(game.tm, game.time, game.kickoff),
          status,
          teams: [
            { id: null, name: home, homeAway: 'home', score: Number.isFinite(homeScore) ? homeScore : null },
            { id: null, name: away, homeAway: 'away', score: Number.isFinite(awayScore) ? awayScore : null },
          ],
        })
        groups.set(leagueCode, groupsList)
      }
      const leagues = [...groups.values()].map(group => ({ ...group, matchCount: group.matches.length }))
      if (leagues.length) return { leagues, totalMatches: leagues.reduce((sum, league) => sum + league.matchCount, 0) }
      continue
    }

    // Flat array of matches.
    const matches = Array.isArray(root) ? root
      : Array.isArray(root.games) ? root.games
      : Array.isArray(root.matches) ? root.matches
      : Array.isArray(root.events) ? root.events
      : []
    if (!matches.length) continue

    const groups = new Map()
    for (const match of matches) {
      if (!match || typeof match !== 'object') continue
      const home = firstText(match.p1, match.home, match.homeTeam, match.home?.name)
      const away = firstText(match.p2, match.away, match.awayTeam, match.away?.name)
      if (!home || !away) continue
      const leagueName = firstText(match.leagueName, match.competition, match.league, 'Live matches')
      const status = hubMatchStatus(match.status ?? match.state)
      const homeScore = Number.parseInt(match.homeScore ?? match.hs ?? match.home?.score, 10)
      const awayScore = Number.parseInt(match.awayScore ?? match.as ?? match.away?.score, 10)
      const group = groups.get(leagueName) || { league: leagueName, matches: [] }
      group.matches.push({
        id: `hub-live-${firstText(match.id, `${home}-${away}`)}`,
        name: `${home} vs ${away}`,
        date: firstText(match.date, match.dt),
        kickoff: firstText(match.time, match.tm, match.kickoff),
        status,
        teams: [
          { id: null, name: home, homeAway: 'home', score: Number.isFinite(homeScore) ? homeScore : null },
          { id: null, name: away, homeAway: 'away', score: Number.isFinite(awayScore) ? awayScore : null },
        ],
      })
      groups.set(leagueName, group)
    }
    const leagues = [...groups.values()].map(group => ({ ...group, matchCount: group.matches.length }))
    if (leagues.length) return { leagues, totalMatches: leagues.reduce((sum, league) => sum + league.matchCount, 0) }
  }
  return null
}

/* ───────────────────────────── Everyday tools ───────────────────────────── */

export async function hubShorten(url) {
  const attempts = [
    { path: '/api/v1/tools/shorten', params: { url } },
    { path: '/api/v1/shorten', params: { url } },
    { path: '/api/v1/tools/shorturl', params: { url } },
  ]
  for (const attempt of attempts) {
    const payload = await hubFetch(attempt.path, { params: attempt.params, timeout: 20000 })
    const result = payload?.result ?? payload
    const shortened = firstText(
      typeof result === 'string' ? result : null,
      result?.shortened_url, result?.shortenedUrl, result?.shortened, result?.short,
      result?.url, result?.shortUrl, result?.result,
    )
    if (/^https?:\/\//i.test(shortened) && shortened !== url) {
      return { original: url, shortened, service: firstText(result?.service, 'hub'), info: firstText(result?.info) || null }
    }
  }
  return null
}

export async function hubCurrencyConversion(amount, from, to) {
  if (!/^[A-Za-z]{3}$/.test(String(from || '').trim()) || !/^[A-Za-z]{3}$/.test(String(to || '').trim())) return null
  const fromCode = String(from).toUpperCase()
  const toCode = String(to).toUpperCase()

  const attempts = [
    { path: '/api/v1/finance/forex', params: { from: fromCode, to: toCode, amount } },
    { path: '/api/v1/forex', params: { from: fromCode, to: toCode, amount } },
    { path: '/api/v1/tools/currency', params: { from: fromCode, to: toCode, amount } },
  ]
  for (const attempt of attempts) {
    const payload = await hubFetch(attempt.path, { params: attempt.params, timeout: 20000 })
    const result = payload?.result ?? payload
    if (!result || typeof result !== 'object') continue

    const value = Number.isFinite(amount) && amount > 0 ? amount : 1
    const direct = Number(result.converted ?? result.to_amount ?? result.toAmount ?? result.convertedAmount)
    const rate = Number(result.rate ?? result.exchange_rate ?? result.rateValue)
    if (Number.isFinite(direct) && direct > 0) {
      return {
        amount: value,
        from: fromCode,
        to: toCode,
        rate: direct / value,
        converted: Math.round(direct * 100) / 100,
        date: firstText(result.date, result.updated) || new Date().toISOString().slice(0, 10),
      }
    }
    if (Number.isFinite(rate) && rate > 0) {
      const converted = value * rate
      return {
        amount: value,
        from: fromCode,
        to: toCode,
        rate,
        converted: Math.round(converted * 100) / 100,
        date: firstText(result.date, result.updated) || new Date().toISOString().slice(0, 10),
      }
    }
  }
  return null
}
