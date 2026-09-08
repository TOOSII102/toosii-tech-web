'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import LivePlayer from '../../components/LivePlayer'
import { useBackNavigation } from '../../lib/useBackNavigation'
import './live-tv.css'

const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#111827"/><path d="M18 24h28v18H18z" fill="none" stroke="#72f0ba" stroke-width="3"/><path d="m24 24-5-7m17 7 5-7" stroke="#72f0ba" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
)

function ChannelLogo({ src, alt }) {
  const [failed, setFailed] = useState(false)
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={failed || !src ? PLACEHOLDER : src}
      alt={alt}
      className="lt-logo"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

export default function LiveTvPage() {
  const [channels, setChannels]   = useState([])
  const [facets, setFacets]       = useState({ countries: [], categories: [], languages: [], regions: [], total: 0 })
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [query, setQuery]         = useState('')
  const [search, setSearch]       = useState('')
  const [country, setCountry]     = useState('')
  const [category, setCategory]   = useState('')
  const [language, setLanguage]   = useState('')
  const [region, setRegion]       = useState('')
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [active, setActive]       = useState(null)
  const [sourceIndex, setSourceIndex] = useState(0)
  const [copied, setCopied]       = useState(false)
  const gridRef = useRef(null)

  // Close the player with the hardware/browser back button instead of leaving the
  // page. closePlayer keeps the in-app close button and the device back button in
  // sync so each undoes exactly one history entry.
  const closePlayer = useBackNavigation(Boolean(active), () => setActive(null))

  /* debounce the search box so typing doesn't fire a request per keystroke */
  useEffect(() => {
    const id = setTimeout(() => { setSearch(query); setPage(1) }, 350)
    return () => clearTimeout(id)
  }, [query])

  /* filter lists */
  useEffect(() => {
    let cancelled = false
    fetch('/api/v1/live-tv?facets=1')
      .then(r => r.json())
      .then(d => {
        if (cancelled || !d.success) return
        setFacets({
          countries: d.countries || [],
          categories: d.categories || [],
          languages: d.languages || [],
          regions: d.regions || [],
          total: d.total || 0,
        })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  /* channel list */
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ page: String(page), limit: '48' })
    if (search)   params.set('q', search)
    if (country)  params.set('country', country)
    if (category) params.set('category', category)
    if (language) params.set('language', language)
    if (region)   params.set('region', region)

    fetch(`/api/v1/live-tv?${params}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        if (!d.success) throw new Error(d?.error?.message || 'Could not load channels.')
        setChannels(d.channels || [])
        setPagination(d.pagination || { page: 1, pages: 1, total: 0 })
      })
      .catch(err => { if (!cancelled) setError(err.message || 'Could not load channels.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [search, country, category, language, region, page])

  const goToPage = useCallback(next => {
    setPage(next)
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const shareChannel = useCallback(async channel => {
    const params = new URLSearchParams({
      title: channel.name,
      subtitle: channel.countryName || 'Live TV channel',
      url: channel.streams?.[sourceIndex]?.url || channel.streams?.[0]?.url || '',
      id: channel.id,
      country: channel.countryName || '',
      category: channel.categories?.[0] || '',
      language: channel.languages?.[0] || '',
    })
    if (channel.logo) params.set('thumbnail', channel.logo)
    const link = `${window.location.origin}/live-tv/share?${params}`
    try {
      if (navigator.share) await navigator.share({ title: channel.name, url: link })
      else {
        await navigator.clipboard.writeText(link)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch { /* user dismissed the share sheet */ }
  }, [sourceIndex])

  const resetFilters = () => { setQuery(''); setSearch(''); setCountry(''); setCategory(''); setLanguage(''); setRegion(''); setPage(1) }
  const hasFilters = Boolean(search || country || category || language || region)

  return (
    <div className="lt-page">
      <div className="lt-inner">
        <span className="lt-eyebrow">TOOSII LIVE TV</span>
        <h1 className="lt-title">Watch <span>live channels</span> free</h1>
        <p className="lt-intro">
          {facets.total ? `${facets.total.toLocaleString()} free-to-air channels` : 'Thousands of free-to-air channels'} from around the world,
          streamed straight in your browser. No sign-up, no app.
        </p>

        <div className="lt-controls">
          <input
            type="search"
            className="lt-search"
            placeholder="Search channels — BBC, Al Jazeera, Citizen TV…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search live TV channels"
          />
          <select className="lt-select" value={region} onChange={e => { setRegion(e.target.value); setPage(1) }} aria-label="Filter by region">
            <option value="">All regions</option>
            {(facets.regions || []).map(r => (
              <option key={r.code} value={r.code}>{r.name} ({r.count})</option>
            ))}
          </select>
          <select className="lt-select" value={country} onChange={e => { setCountry(e.target.value); setPage(1) }} aria-label="Filter by country">
            <option value="">All countries</option>
            {(facets.countries || []).map(c => (
              <option key={c.code} value={c.code}>{c.flag ? `${c.flag} ` : ''}{c.name} ({c.count})</option>
            ))}
          </select>
          <select className="lt-select" value={category} onChange={e => { setCategory(e.target.value); setPage(1) }} aria-label="Filter by category">
            <option value="">All categories</option>
            {(facets.categories || []).map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.count})</option>
            ))}
          </select>
          <select className="lt-select" value={language} onChange={e => { setLanguage(e.target.value); setPage(1) }} aria-label="Filter by language">
            <option value="">All languages</option>
            {(facets.languages || []).map(l => (
              <option key={l.code} value={l.code}>{l.name} ({l.count})</option>
            ))}
          </select>
          {hasFilters && <button type="button" className="lt-clear" onClick={resetFilters}>Clear</button>}
        </div>

        <div className="lt-meta" ref={gridRef}>
          {loading ? 'Loading channels…'
            : error ? ''
            : `${pagination.total.toLocaleString()} channel${pagination.total === 1 ? '' : 's'}${hasFilters ? ' matched' : ''}`}
        </div>

        {error && (
          <div className="lt-empty">
            <h3>Couldn&apos;t load channels</h3>
            <p>{error}</p>
          </div>
        )}

        {!error && loading && (
          <div className="lt-grid">
            {Array.from({ length: 12 }).map((_, i) => <div key={i} className="lt-card lt-skeleton" />)}
          </div>
        )}

        {!error && !loading && channels.length === 0 && (
          <div className="lt-empty">
            <h3>No channels found</h3>
            <p>Try a different search term, or clear the filters to see everything.</p>
          </div>
        )}

        {!error && !loading && channels.length > 0 && (
          <div className="lt-grid">
            {channels.map(channel => (
              <button
                type="button"
                key={channel.id}
                className="lt-card"
                onClick={() => { setSourceIndex(0); setActive(channel) }}
                aria-label={`Watch ${channel.name}`}
              >
                <ChannelLogo src={channel.logo} alt={channel.name} />
                <span className="lt-card-body">
                  <span className="lt-card-name">{channel.name}</span>
                  <span className="lt-card-sub">
                    {channel.flag ? `${channel.flag} ` : ''}{channel.countryName || '—'}
                  </span>
                  {(channel.categories?.length > 0 || channel.format) && (
                    <span className="lt-card-tag">
                      {channel.categories?.[0]}{channel.categories?.[0] && channel.format ? ' · ' : ''}{channel.format}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}

        {!error && !loading && pagination.pages > 1 && (
          <div className="lt-pager">
            <button type="button" onClick={() => goToPage(pagination.page - 1)} disabled={pagination.page <= 1}>← Prev</button>
            <span>Page {pagination.page} of {pagination.pages}</span>
            <button type="button" onClick={() => goToPage(pagination.page + 1)} disabled={pagination.page >= pagination.pages}>Next →</button>
          </div>
        )}

        <p className="lt-credit">
          Channel data from the free{' '}
          <a href="https://iptv-org.github.io" target="_blank" rel="noopener noreferrer">iptv-org</a>{' '}
          public API. Toosii Tech does not host or own these streams.
        </p>
      </div>

      {active && (
        <div className="lt-modal" role="dialog" aria-modal="true" aria-label={active.name} onClick={closePlayer}>
          <div className="lt-modal-card" onClick={e => e.stopPropagation()}>
            <div className="lt-modal-head">
              <ChannelLogo src={active.logo} alt={active.name} />
              <div className="lt-modal-titles">
                <h2>{active.name}</h2>
                <p>{active.flag ? `${active.flag} ` : ''}{active.countryName || '—'}{active.categories?.[0] ? ` · ${active.categories[0]}` : ''}</p>
              </div>
              <button type="button" className="lt-close" onClick={closePlayer} aria-label="Close player">✕</button>
            </div>

            <LivePlayer
              key={`${active.id}-${sourceIndex}`}
              src={active.streams?.[sourceIndex]?.url}
              title={active.name}
              // Public IPTV streams go offline constantly. When one fails, roll
              // straight on to the next source instead of dead-ending the user.
              onError={() => {
                setSourceIndex(i => (i + 1 < (active.streams?.length || 0) ? i + 1 : i))
              }}
            />

            <div className="lt-modal-actions">
              <button type="button" className="lt-share" onClick={() => shareChannel(active)}>
                {copied ? '✓ Link copied' : '↗ Share channel'}
              </button>
              {active.website && (
                <a className="lt-site" href={active.website} target="_blank" rel="noopener noreferrer">Official site</a>
              )}
            </div>

            {active.streams?.length > 1 && (
              <p className="lt-alt">
                Source {sourceIndex + 1} of {active.streams.length}
                {sourceIndex + 1 < active.streams.length
                  ? ' — if this one fails the next is tried automatically.'
                  : ' — last available source. The channel may be offline or blocking browser playback.'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
