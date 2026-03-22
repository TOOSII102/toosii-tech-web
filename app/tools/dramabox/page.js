'use client'
import Layout from '../../../components/Layout'
import { useState, useEffect, useCallback, useRef } from 'react'
import '../tools.css'
import './dramabox.css'

const TABS = [
  { id: 'Trending', icon: '🔥', label: 'Trending' },
  { id: 'Browse',   icon: '🎭', label: 'Browse' },
  { id: 'Search',   icon: '🔍', label: 'Search' },
]

const PARTICLES = [
  { left: '5%',  delay: '0s',    dur: '6s',  w: 5, h: 5 },
  { left: '12%', delay: '1.2s',  dur: '8s',  w: 3, h: 3 },
  { left: '20%', delay: '0.5s',  dur: '7s',  w: 6, h: 6 },
  { left: '28%', delay: '3s',    dur: '5s',  w: 4, h: 4 },
  { left: '35%', delay: '1.8s',  dur: '9s',  w: 3, h: 3 },
  { left: '42%', delay: '0.3s',  dur: '6.5s',w: 7, h: 7 },
  { left: '50%', delay: '2.5s',  dur: '8s',  w: 4, h: 4 },
  { left: '57%', delay: '4s',    dur: '7s',  w: 5, h: 5 },
  { left: '63%', delay: '1s',    dur: '5.5s',w: 3, h: 3 },
  { left: '70%', delay: '2.2s',  dur: '9s',  w: 6, h: 6 },
  { left: '76%', delay: '0.8s',  dur: '7.5s',w: 4, h: 4 },
  { left: '82%', delay: '3.5s',  dur: '6s',  w: 5, h: 5 },
  { left: '88%', delay: '1.5s',  dur: '8.5s',w: 3, h: 3 },
  { left: '93%', delay: '0.2s',  dur: '7s',  w: 7, h: 7 },
  { left: '97%', delay: '2.8s',  dur: '5s',  w: 4, h: 4 },
  { left: '8%',  delay: '5s',    dur: '6s',  w: 3, h: 3 },
  { left: '45%', delay: '4.5s',  dur: '9s',  w: 5, h: 5 },
  { left: '60%', delay: '3.8s',  dur: '7s',  w: 4, h: 4 },
  { left: '75%', delay: '5.5s',  dur: '8s',  w: 6, h: 6 },
  { left: '90%', delay: '2s',    dur: '6.5s',w: 3, h: 3 },
]

function safeEpCount(drama) {
  if (!drama) return null
  if (typeof drama.total_episodes === 'number') return drama.total_episodes
  if (Array.isArray(drama.episodes)) return drama.episodes.length
  if (typeof drama.episodes === 'number') return drama.episodes
  return null
}

function SkeletonCard() {
  return (
    <div className="drama-card skeleton-card">
      <div className="drama-cover-wrap skeleton-img" />
      <div className="drama-info">
        <div className="skeleton-line" style={{ width: '85%', height: 12, marginBottom: 8 }} />
        <div className="skeleton-line" style={{ width: '55%', height: 10 }} />
      </div>
    </div>
  )
}

function DramaCard({ drama, onClick, featured }) {
  const epCount = safeEpCount(drama)
  return (
    <div
      className={`drama-card ${featured ? 'drama-card--featured' : ''}`}
      onClick={() => onClick(drama)}
    >
      <div className="drama-cover-wrap">
        <img
          src={drama.cover}
          alt={drama.title}
          className="drama-cover"
          loading="lazy"
          onError={e => { e.target.src = 'https://placehold.co/240x400/0a0a0a/25d366?text=🎬' }}
        />
        <div className="drama-overlay">
          <div className="drama-play-btn">▶</div>
          {drama.introduction && (
            <p className="drama-overlay-text">{drama.introduction.slice(0, 80)}…</p>
          )}
        </div>
        {epCount && <span className="drama-badge">📺 {epCount} eps</span>}
        {featured && <span className="drama-hot-badge">🔥 HOT</span>}
      </div>
      <div className="drama-info">
        <p className="drama-title">{drama.title}</p>
        <div className="drama-footer">
          {drama.views > 0 && (
            <span className="drama-views">👁 {(drama.views / 1000).toFixed(1)}k</span>
          )}
          {drama.tags?.length > 0 && (
            <span className="drama-tag">{drama.tags[0]}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function Spotlight({ drama, onClick }) {
  if (!drama) return null
  const epCount = safeEpCount(drama)
  return (
    <div className="spotlight" onClick={() => onClick(drama)}>
      <div className="spotlight-bg" style={{ backgroundImage: `url(${drama.cover})` }} />
      <div className="spotlight-gradient" />
      <div className="spotlight-content">
        <span className="spotlight-label">✨ Featured Pick</span>
        <h2 className="spotlight-title">{drama.title}</h2>
        {drama.introduction && (
          <p className="spotlight-intro">{drama.introduction.slice(0, 160)}…</p>
        )}
        <div className="spotlight-meta">
          {epCount && <span>📺 {epCount} Episodes</span>}
          {drama.views > 0 && <span>👁 {Number(drama.views).toLocaleString()} Views</span>}
          {drama.tags?.slice(0, 2).map(t => <span key={t} className="spotlight-tag">{t}</span>)}
        </div>
        <button className="spotlight-btn">▶ Watch Now</button>
      </div>
    </div>
  )
}

function DetailModal({ drama, onClose, onSelect }) {
  const [detail,        setDetail]   = useState(null)
  const [episodes,      setEps]      = useState([])
  const [loading,       setLoading]  = useState(true)
  const [activeEp,      setActiveEp] = useState(null)
  const [dlLoading,     setDlLoading] = useState(false)
  const [sidebarDramas, setSidebar]  = useState([])
  const playerRef = useRef(null)
  const epListRef = useRef(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    setActiveEp(null)
    setDetail(null)
    setEps([])
    setSidebar([])
    setLoading(true)

    async function load() {
      try {
        const [dRes, eRes, tRes] = await Promise.all([
          fetch(`/api/tools/dramabox?action=detail&id=${drama.id}`),
          fetch(`/api/tools/dramabox?action=episodes&id=${drama.id}`),
          fetch(`/api/tools/dramabox?action=trending`)
        ])
        const [dData, eData, tData] = await Promise.all([dRes.json(), eRes.json(), tRes.json()])
        setDetail(dData.drama || null)
        setEps(eData.episodes?.slice(0, 60) || [])
        const all = tData.featured || tData.dramas || []
        setSidebar(all.filter(d => String(d.id) !== String(drama.id)).slice(0, 10))
      } catch {}
      setLoading(false)
    }
    load()
  }, [drama.id])

  const selectEpisode = (idx) => {
    setActiveEp(idx)
    setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80)
  }

  const handleDownload = () => {
    if (activeEp === null || dlLoading) return
    setDlLoading(true)

    /* Load the download URL inside a hidden iframe.
       The server responds with Content-Disposition: attachment so the browser
       shows a save-file dialog while this page stays unchanged. */
    const url = `/api/tools/dramabox?action=download&id=${drama.id}&episode=${activeEp}`
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;top:-300%;left:-300%;width:1px;height:1px;opacity:0;pointer-events:none'
    iframe.src = url
    document.body.appendChild(iframe)

    /* Remove the iframe after enough time for the download dialog to appear */
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe)
      setDlLoading(false)
    }, 10000)
  }

  const watchUrl = (idx) => `/api/tools/dramabox?action=watch&id=${drama.id}&episode=${idx}`
  const info     = detail || drama
  const epCount  = safeEpCount(info)

  const hasSidebar = activeEp !== null && sidebarDramas.length > 0

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal-box ${hasSidebar ? 'modal-box--wide' : ''}`}>

        {/* ── Compact info header (always full width) ── */}
        <div className="modal-info-bar">
          <img
            src={info.cover}
            alt={info.title}
            className="modal-thumb"
            onError={e => { e.target.src = 'https://placehold.co/60x90/0a0a0a/25d366?text=🎬' }}
          />
          <div className="modal-info-text">
            <h2 className="modal-title">{info.title}</h2>
            <div className="modal-meta-row">
              {epCount != null && <span className="modal-meta-chip">📺 {epCount} eps</span>}
              {Number(info.views) > 0 && (
                <span className="modal-meta-chip">👁 {Number(info.views).toLocaleString()}</span>
              )}
              {info.tags?.slice(0, 2).map(t => (
                <span key={t} className="modal-meta-chip modal-tag-chip">{t}</span>
              ))}
            </div>
            {info.introduction && (
              <p className="modal-synopsis">{info.introduction.slice(0, 120)}…</p>
            )}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* ── Body: main + sidebar grid ── */}
        <div className={`modal-body-layout ${hasSidebar ? 'has-sidebar' : ''}`}>

          {/* ── Main column ── */}
          <div className="modal-main">

            {/* Player */}
            {activeEp !== null && (
              <div className="player-section" ref={playerRef}>
                <div className="player-header">
                  <span className="player-ep-label">EP {activeEp + 1}</span>
                  <span className="player-title">{info.title}</span>
                  <a
                    href={watchUrl(activeEp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="player-fullscreen-btn"
                    title="Open fullscreen"
                  >⛶</a>
                </div>
                <div className="player-frame-wrap">
                  <iframe
                    key={activeEp}
                    src={watchUrl(activeEp)}
                    className="player-frame"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    title={`Episode ${activeEp + 1}`}
                  />
                </div>
                <div className="player-actions">
                  <button
                    onClick={handleDownload}
                    className={`player-btn player-btn--download ${dlLoading ? 'loading' : ''}`}
                    disabled={dlLoading}
                  >
                    {dlLoading ? (
                      <><span className="dl-spinner" /> Preparing…</>
                    ) : (
                      <><span>⬇</span> Download Episode {activeEp + 1}</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Episodes */}
            {loading ? (
              <div className="modal-loading">
                <div className="db-spinner" />
                <span>Loading episodes…</span>
              </div>
            ) : episodes.length > 0 ? (
              <div className="modal-episodes">
                <div className="modal-ep-header">
                  <span className="modal-ep-title">Episodes</span>
                  {activeEp !== null && (
                    <span className="now-playing-badge">▶ Ep {activeEp + 1}</span>
                  )}
                </div>
                <div className="episode-grid" ref={epListRef}>
                  {episodes.map((ep, idx) => (
                    <button
                      key={idx}
                      className={`episode-btn ${activeEp === idx ? 'active' : ''}`}
                      onClick={() => selectEpisode(idx)}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

          </div>

          {/* ── Sidebar ── */}
          {hasSidebar && (
            <aside className="modal-sidebar">
              <p className="sidebar-heading">More Like This</p>
              <div className="sidebar-list">
                {sidebarDramas.map(d => (
                  <button
                    key={d.id}
                    className="sidebar-card"
                    onClick={() => onSelect && onSelect(d)}
                  >
                    <img
                      src={d.cover}
                      alt={d.title}
                      className="sidebar-card-img"
                      onError={e => { e.target.src = 'https://placehold.co/52x74/0a0a0a/25d366?text=🎬' }}
                    />
                    <div className="sidebar-card-info">
                      <p className="sidebar-card-title">{d.title}</p>
                      <div className="sidebar-card-meta">
                        {safeEpCount(d) != null && (
                          <span className="sidebar-card-chip">📺 {safeEpCount(d)} eps</span>
                        )}
                        {d.tags?.slice(0, 1).map(t => (
                          <span key={t} className="sidebar-card-chip sidebar-card-tag">{t}</span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </aside>
          )}

        </div>
      </div>
    </div>
  )
}

export default function DramaBoxPage() {
  const [tab, setTab]           = useState('Trending')
  const [dramas, setDramas]     = useState([])
  const [genres, setGenres]     = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [query, setQuery]       = useState('')
  const [genre, setGenre]       = useState('0')
  const [page, setPage]         = useState(1)
  const [totalPages, setTotal]  = useState(1)
  const [selected, setSelected] = useState(null)
  const searchRef = useRef(null)

  /* ── History-aware drama open / close ── */
  const openDrama = useCallback((drama) => {
    window.history.pushState({ dramaModal: drama.id }, '')
    setSelected(drama)
  }, [])

  const closeDrama = useCallback(() => {
    setSelected(null)
    if (window.history.state?.dramaModal) window.history.back()
  }, [])

  useEffect(() => {
    const onPop = () => setSelected(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const fetchDramas = useCallback(async (opts = {}) => {
    const t = opts.tab   ?? tab
    const g = opts.genre ?? genre
    const p = opts.page  ?? page
    const q = opts.query ?? query

    setLoading(true); setError(''); setDramas([])
    try {
      let url = '/api/tools/dramabox?'
      if (t === 'Trending') url += 'action=trending'
      else if (t === 'Browse') url += `action=browse&genre=${g}&page=${p}`
      else url += `action=search&q=${encodeURIComponent(q)}&page=${p}`

      const res  = await fetch(url)
      const data = await res.json()
      if (data.error) { setError(data.error); return }

      const items = data.featured || data.results || data.dramas || []
      setDramas(items)
      setTotal(data.total_pages || 1)
    } catch {
      setError('Failed to load dramas. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [tab, genre, page, query])

  useEffect(() => {
    fetch('/api/tools/dramabox?action=genres')
      .then(r => r.json())
      .then(d => { if (d.genres) setGenres(d.genres) })
      .catch(() => {})
    fetchDramas({ tab: 'Trending' })
  }, [])

  const switchTab = (t) => {
    setTab(t); setPage(1); setDramas([]); setError('')
    if (t !== 'Search') fetchDramas({ tab: t, page: 1 })
    else setTimeout(() => searchRef.current?.focus(), 100)
  }

  const handleSearch = () => {
    if (!query.trim()) return
    setPage(1)
    fetchDramas({ tab: 'Search', page: 1 })
  }

  const handleGenre = (g) => {
    setGenre(g); setPage(1)
    fetchDramas({ tab: 'Browse', genre: g, page: 1 })
  }

  const changePage = (p) => {
    setPage(p)
    fetchDramas({ page: p })
    window.scrollTo({ top: 400, behavior: 'smooth' })
  }

  const spotlight  = tab === 'Trending' && dramas.length > 0 ? dramas[0] : null
  const gridDramas = tab === 'Trending' && dramas.length > 0 ? dramas.slice(1) : dramas

  return (
    <Layout>
      <div className="db-page">

        <div className="db-hero">
          <div className="db-hero-particles">
            {PARTICLES.map((p, i) => (
              <span key={i} className="particle" style={{
                left: p.left,
                animationDelay: p.delay,
                animationDuration: p.dur,
                width: p.w + 'px',
                height: p.h + 'px',
              }} />
            ))}
          </div>
          <div className="db-hero-inner page-wrapper">
            <div className="db-badge">🎬 DramaBox</div>
            <h1 className="db-title">Short Dramas, <span className="db-title-accent">Endless Stories</span></h1>
            <p className="db-sub">Browse thousands of free short dramas — trending picks, genres, and HD streams all in one place.</p>
            <div className="db-hero-tabs">
              {TABS.map(t => (
                <button
                  key={t.id}
                  className={`db-hero-tab ${tab === t.id ? 'active' : ''}`}
                  onClick={() => switchTab(t.id)}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="db-body page-wrapper" style={{ maxWidth: '1140px' }}>

          {tab === 'Search' && (
            <div className="db-search-box">
              <div className="db-search-inner">
                <span className="db-search-icon">🔍</span>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search dramas by title or theme…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="db-search-input"
                  disabled={loading}
                />
                <button
                  onClick={handleSearch}
                  disabled={loading || !query.trim()}
                  className="db-search-btn"
                >
                  {loading ? '…' : 'Search'}
                </button>
              </div>
            </div>
          )}

          {tab === 'Browse' && genres.length > 0 && (
            <div className="db-genres">
              <button className={`db-genre-pill ${genre === '0' ? 'active' : ''}`} onClick={() => handleGenre('0')}>
                🎭 All
              </button>
              {genres.map(g => (
                <button
                  key={g.id}
                  className={`db-genre-pill ${genre === String(g.id) ? 'active' : ''}`}
                  onClick={() => handleGenre(String(g.id))}
                >
                  {g.name}
                </button>
              ))}
            </div>
          )}

          {error && <div className="db-error">⚠️ {error}</div>}

          {loading && (
            <div className="drama-grid">
              {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && spotlight && (
            <Spotlight drama={spotlight} onClick={openDrama} />
          )}

          {!loading && gridDramas.length > 0 && (
            <div className="db-section-header">
              <span className="db-section-line" />
              <span className="db-section-label">
                {tab === 'Trending' ? '🔥 More Trending' : tab === 'Browse' ? '🎭 All Dramas' : `🔍 Results for "${query}"`}
              </span>
              <span className="db-section-line" />
            </div>
          )}

          {!loading && gridDramas.length > 0 && (
            <div className="drama-grid">
              {gridDramas.map((d, i) => (
                <DramaCard key={d.id || i} drama={d} onClick={openDrama} featured={i === 0 && tab !== 'Trending'} />
              ))}
            </div>
          )}

          {!loading && !error && dramas.length === 0 && tab === 'Search' && query && (
            <div className="db-empty">
              <p className="db-empty-icon">🎬</p>
              <p className="db-empty-title">No dramas found</p>
              <p className="db-empty-sub">Try a different keyword or browse by genre.</p>
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="db-pagination">
              <button disabled={page <= 1} onClick={() => changePage(page - 1)} className="db-page-btn">← Prev</button>
              <div className="db-page-dots">
                {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                  const p = i + 1
                  return (
                    <button key={p} onClick={() => changePage(p)} className={`db-page-dot ${page === p ? 'active' : ''}`}>
                      {p}
                    </button>
                  )
                })}
                {totalPages > 7 && <span style={{ color: '#475569' }}>…{totalPages}</span>}
              </div>
              <button disabled={page >= totalPages} onClick={() => changePage(page + 1)} className="db-page-btn">Next →</button>
            </div>
          )}

          {!loading && (
            <div className="db-features">
              {[
                { icon: '🔥', title: 'Live Trending', text: 'Updated daily with the most-watched short dramas from DramaBox.' },
                { icon: '🎭', title: '50+ Genres', text: 'Romance, revenge, paranormal, werewolves, and much more.' },
                { icon: '📺', title: 'HD Streams', text: 'Watch episodes in 720p — free, no account needed.' },
                { icon: '⚡', title: 'Instant Results', text: 'Search thousands of titles and get results in seconds.' },
              ].map(f => (
                <div key={f.title} className="db-feature-card">
                  <span className="db-feature-icon">{f.icon}</span>
                  <h3 className="db-feature-title">{f.title}</h3>
                  <p className="db-feature-text">{f.text}</p>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {selected && <DetailModal drama={selected} onClose={closeDrama} onSelect={openDrama} />}
    </Layout>
  )
}
