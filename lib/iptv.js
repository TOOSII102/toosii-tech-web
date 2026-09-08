// iptv-org data layer.
//
// Source: https://iptv-org.github.io/api/ (free, public, no key required)
//
// The upstream files are large — channels.json ~7.9 MB, streams.json ~3.6 MB and
// logos.json ~6 MB. They are deliberately NOT passed through Next's fetch data
// cache, whose per-entry limit (2 MB) they blow straight past. Instead each
// server instance downloads them once, reduces them to a compact index, throws
// the raw arrays away and keeps the index in module memory behind a TTL.
//
// The index only retains channels that actually have a playable stream, which
// cuts ~31k catalogue entries down to ~8-9k usable ones.

const API_BASE = 'https://iptv-org.github.io/api'
const TTL_MS = 6 * 60 * 60 * 1000 // 6 hours
const FETCH_TIMEOUT_MS = 30_000

// Survives hot-reload in dev and is shared across requests on a warm instance.
if (!global.__iptvCache) {
  global.__iptvCache = { index: null, builtAt: 0, building: null }
}
const cache = global.__iptvCache

async function getJson(file) {
  const res = await fetch(`${API_BASE}/${file}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`iptv-org ${file} returned ${res.status}`)
  return res.json()
}

function isHttps(url) {
  return typeof url === 'string' && url.startsWith('https://')
}

async function buildIndex() {
  const [channels, streams, logos, countries, categories] = await Promise.all([
    getJson('channels.json'),
    getJson('streams.json'),
    getJson('logos.json'),
    getJson('countries.json'),
    getJson('categories.json'),
  ])

  // Best logo per channel: prefer one marked in_use, then the widest.
  const logoByChannel = new Map()
  for (const logo of logos) {
    const id = logo?.channel
    if (!id || !logo.url) continue
    const current = logoByChannel.get(id)
    if (!current) { logoByChannel.set(id, logo); continue }
    const better =
      (logo.in_use && !current.in_use) ||
      (logo.in_use === current.in_use && (logo.width || 0) > (current.width || 0))
    if (better) logoByChannel.set(id, logo)
  }

  // Group streams by channel id.
  const streamsByChannel = new Map()
  for (const s of streams) {
    const id = s?.channel
    if (!id || !s.url) continue
    if (!streamsByChannel.has(id)) streamsByChannel.set(id, [])
    streamsByChannel.get(id).push({
      url: s.url,
      quality: s.quality || null,
      secure: isHttps(s.url),
    })
  }

  const countryNames = new Map(countries.map(c => [c.code, c.name]))
  const countryFlags = new Map(countries.map(c => [c.code, c.flag]))
  const categoryNames = new Map(categories.map(c => [c.id, c.name]))

  const items = []
  for (const ch of channels) {
    const chStreams = streamsByChannel.get(ch.id)
    if (!chStreams || !chStreams.length) continue   // no stream = not watchable
    if (ch.is_nsfw) continue                        // never surface adult channels
    if (ch.closed || ch.replaced_by) continue       // defunct

    // Secure streams first, then by quality, so the default pick is playable
    // from an HTTPS page.
    chStreams.sort((a, b) => {
      if (a.secure !== b.secure) return a.secure ? -1 : 1
      return (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0)
    })

    items.push({
      id: ch.id,
      name: ch.name,
      country: ch.country || null,
      countryName: countryNames.get(ch.country) || null,
      flag: countryFlags.get(ch.country) || null,
      categories: Array.isArray(ch.categories) ? ch.categories : [],
      website: ch.website || null,
      logo: logoByChannel.get(ch.id)?.url || null,
      streams: chStreams,
      hasSecure: chStreams.some(s => s.secure),
      // Lowercased haystack so search doesn't re-lowercase on every request.
      search: [ch.name, ...(ch.alt_names || []), ch.id].join(' ').toLowerCase(),
    })
  }

  items.sort((a, b) => a.name.localeCompare(b.name))

  // Facets built from what is actually present, not the full upstream lists.
  const countryCounts = new Map()
  const categoryCounts = new Map()
  for (const it of items) {
    if (!it.hasSecure) continue // match the secure-only default the UI uses
    if (it.country) countryCounts.set(it.country, (countryCounts.get(it.country) || 0) + 1)
    for (const c of it.categories) categoryCounts.set(c, (categoryCounts.get(c) || 0) + 1)
  }

  return {
    items,
    // The UI defaults to secure-only, so headline counts must match what the
    // default listing actually shows (otherwise the intro and the result count
    // disagree).
    totalSecure: items.reduce((n, it) => n + (it.hasSecure ? 1 : 0), 0),
    countries: [...countryCounts.entries()]
      .map(([code, count]) => ({ code, name: countryNames.get(code) || code, flag: countryFlags.get(code) || null, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    categories: [...categoryCounts.entries()]
      .map(([id, count]) => ({ id, name: categoryNames.get(id) || id, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    total: items.length,
  }
}

/** Returns the cached index, rebuilding it when stale. Concurrent callers share one build. */
export async function getIptvIndex() {
  const fresh = cache.index && Date.now() - cache.builtAt < TTL_MS
  if (fresh) return cache.index

  // De-duplicate simultaneous cold-start builds.
  if (cache.building) return cache.building

  cache.building = (async () => {
    try {
      const index = await buildIndex()
      cache.index = index
      cache.builtAt = Date.now()
      return index
    } catch (err) {
      // Serve stale data rather than failing outright if a refresh breaks.
      if (cache.index) return cache.index
      throw err
    } finally {
      cache.building = null
    }
  })()

  return cache.building
}

/** Filter + paginate the index. */
export function queryChannels(index, { q = '', country = '', category = '', secureOnly = true, page = 1, limit = 48 } = {}) {
  const needle = String(q).trim().toLowerCase()
  const cc = String(country).trim().toUpperCase()
  const cat = String(category).trim().toLowerCase()

  let results = index.items
  if (secureOnly) results = results.filter(c => c.hasSecure)
  if (cc) results = results.filter(c => c.country === cc)
  if (cat) results = results.filter(c => c.categories.includes(cat))
  if (needle) results = results.filter(c => c.search.includes(needle))

  const total = results.length
  const perPage = Math.min(Math.max(parseInt(limit) || 48, 1), 100)
  const pages = Math.max(Math.ceil(total / perPage), 1)
  const current = Math.min(Math.max(parseInt(page) || 1, 1), pages)
  const start = (current - 1) * perPage

  return {
    channels: results.slice(start, start + perPage).map(c => ({
      id: c.id,
      name: c.name,
      country: c.country,
      countryName: c.countryName,
      flag: c.flag,
      categories: c.categories,
      logo: c.logo,
      website: c.website,
      // Only the streams the client can actually use, capped.
      streams: (secureOnly ? c.streams.filter(s => s.secure) : c.streams).slice(0, 5),
    })),
    pagination: { page: current, pages, perPage, total },
  }
}
