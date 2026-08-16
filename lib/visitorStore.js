import { readFileSync, writeFileSync, existsSync } from 'fs'

  const TMP_FILE = '/tmp/toosii_visits.json'
  const MAX_HITS = 2000

  function loadStore() {
    if (!global.__visits) {
      let saved = { hits: [], startTime: Date.now() }
      try {
        if (existsSync(TMP_FILE)) saved = JSON.parse(readFileSync(TMP_FILE, 'utf8'))
      } catch {}
      global.__visits = { hits: saved.hits || [], startTime: saved.startTime || Date.now() }
    }
    return global.__visits
  }

  function persist() {
    try {
      const s = global.__visits
      writeFileSync(TMP_FILE, JSON.stringify({ hits: s.hits, startTime: s.startTime }))
    } catch {}
  }

  export function recordHit({ page, country, city, device, referrer }) {
    const s = loadStore()
    s.hits.unshift({ page, country: country || '', city: city || '', device: device || 'desktop', referrer: referrer || '', ts: Date.now() })
    if (s.hits.length > MAX_HITS) s.hits.length = MAX_HITS
    persist()
  }

  export function getVisitorStats() {
    const s = loadStore()
    const hits = s.hits
    const now  = Date.now()
    const day  = 86400000

    const todayHits = hits.filter(h => now - h.ts < day)
    const weekHits  = hits.filter(h => now - h.ts < 7 * day)

    const pageMap = {}
    weekHits.forEach(h => { if (h.page) pageMap[h.page] = (pageMap[h.page] || 0) + 1 })
    const topPages = Object.entries(pageMap).sort(([,a],[,b]) => b - a).slice(0, 12).map(([page, views]) => ({ page, views }))

    const countryMap = {}
    weekHits.forEach(h => { if (h.country) countryMap[h.country] = (countryMap[h.country] || 0) + 1 })
    const countries = Object.entries(countryMap).sort(([,a],[,b]) => b - a).slice(0, 12).map(([country, visitors]) => ({ country, visitors }))

    const mobile  = weekHits.filter(h => h.device === 'mobile').length
    const desktop = weekHits.filter(h => h.device === 'desktop').length

    const daily = []
    for (let i = 6; i >= 0; i--) {
      const from  = now - (i + 1) * day
      const to    = now - i * day
      const label = new Date(to).toLocaleDateString('en', { weekday: 'short' })
      daily.push({ label, count: hits.filter(h => h.ts >= from && h.ts < to).length })
    }

    return {
      todayViews: todayHits.length,
      weekViews:  weekHits.length,
      totalViews: hits.length,
      topPages,
      countries,
      devices: { mobile, desktop },
      daily,
      recent: hits.slice(0, 25),
      uptime: Math.floor((now - s.startTime) / 1000),
    }
  }
  