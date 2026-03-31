'use client'
  import { useState, useCallback, useEffect, useRef } from 'react'
  import '../tools.css'
  import './movies.css'

  const API  = '/api/tools/movies'
  const XCDN = 'https://movieapi.xcasper.space/api/bff/stream'
  const RESS = [1080, 720, 480, 360]

  /* ── utils ── */
  const cover  = m => m?.cover?.url || m?.cover || ''
  const year   = m => (m?.releaseDate || '').slice(0, 4)
  const dur    = s => { if (!s) return ''; const h = Math.floor(s/3600), m = Math.floor((s%3600)/60); return h ? h+'h '+m+'m' : m+'m' }
  const isTV   = m => (m?.subjectType || 1) === 2

  /* Parse "S1-S2" or "S3" or "(Season 4)" from title → max season number */
  function parseMaxSeason(title) {
    if (!title) return 1
    const nums = [...(title.matchAll(/[Ss](\d+)/g))].map(m => +m[1])
    return nums.length ? Math.max(...nums) : 1
  }

  /* Build direct stream URL (Option A — browser hits xcasper with no-referrer) */
  function streamUrl(id, res, se, ep) {
    let u = XCDN + '?subjectId=' + encodeURIComponent(id) + '&resolution=' + res
    if (se && ep) u += '&se=' + se + '&ep=' + ep
    return u
  }

  /* Build proxy URL (Option B — server adds Referer/Range) */
  function proxyUrl(id, res, se, ep) {
    let u = API + '?action=stream&id=' + encodeURIComponent(id) + '&res=' + res
    if (se && ep) u += '&se=' + se + '&ep=' + ep
    return u
  }

  /* ── Skeleton ── */
  function Skeleton() {
    return (
      <div className="mv-card mv-card-skeleton">
        <div className="mv-poster-wrap skeleton-img" />
        <div className="mv-card-info">
          <div className="skeleton-line" style={{ width: '80%', height: 11, marginBottom: 6 }} />
          <div className="skeleton-line" style={{ width: '50%', height: 9 }} />
        </div>
      </div>
    )
  }

  /* ── Movie card ── */
  function Card({ movie, onClick }) {
    return (
      <div className="mv-card" onClick={() => onClick(movie)}>
        <div className="mv-poster-wrap">
          <img src={cover(movie)} alt={movie.title} className="mv-poster" loading="lazy"
            onError={e => { e.target.src = 'https://placehold.co/300x450/0d0d1a/8b5cf6?text=🎬' }} />
          <div className="mv-poster-overlay"><div className="mv-play-icon">▶</div></div>
          {movie.imdbRatingValue && <span className="mv-rating-badge">⭐ {movie.imdbRatingValue}</span>}
          <span className="mv-type-badge">{isTV(movie) ? '📺 Series' : '🎬 Movie'}</span>
        </div>
        <div className="mv-card-info">
          <p className="mv-card-title">{movie.title}</p>
          <div className="mv-card-meta">
            <span className="mv-card-year">{year(movie)}</span>
            {movie.genre && <span className="mv-card-genre">{movie.genre.split(',')[0].trim()}</span>}
          </div>
        </div>
      </div>
    )
  }

  /* ── Detail modal ── */
  function Modal({ movie, onClose, onSelect }) {
    const [detail,  setDetail]  = useState(null)
    const [loading, setLoading] = useState(true)
    const [recs,    setRecs]    = useState([])

    /* player state */
    const [res,     setRes]     = useState(720)
    const [season,  setSeason]  = useState(1)
    const [ep,      setEp]      = useState(1)
    const [playing, setPlaying] = useState(false)
    const [useProxy, setUseProxy] = useState(false)
    const histRef = useRef(false)

    /* scroll lock + back button */
    useEffect(() => {
      document.body.style.overflow = 'hidden'
      window.history.pushState({ mv: true }, '')
      histRef.current = true
      const onPop = () => { histRef.current = false; onClose() }
      window.addEventListener('popstate', onPop)
      return () => { document.body.style.overflow = ''; window.removeEventListener('popstate', onPop) }
    }, [onClose])

    const close = useCallback(() => {
      if (histRef.current) { histRef.current = false; window.history.back() }
      else onClose()
    }, [onClose])

    /* fetch detail + recommendations in parallel */
    useEffect(() => {
      setDetail(null); setLoading(true); setPlaying(false); setUseProxy(false)
      ;(async () => {
        try {
          const [dR, rR] = await Promise.all([
            fetch(API + '?action=detail&id=' + movie.subjectId),
            fetch(API + '?action=recommend&id=' + movie.subjectId),
          ])
          const [dD, rD] = await Promise.all([dR.json(), rR.json()])
          setDetail(dD?.data || null)
          setRecs((rD?.data?.subjectList || rD?.data?.items || []).slice(0, 12))
        } catch {}
        setLoading(false)
      })()
    }, [movie.subjectId])

    const d      = detail || movie
    const tv     = isTV(d)
    const maxSe  = parseMaxSeason(d?.title)
    const poster = cover(d)

    /* pick how many episodes per season to show (default 24, cap reasonable) */
    const epCount = 24

    function scrollToPlayer() {
      setTimeout(() => document.querySelector('.mv-video-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    }

    function play(s, e) {
      setSeason(s); setEp(e); setPlaying(true); setUseProxy(false)
      scrollToPlayer()
    }

    function toggleProxy() {
      setUseProxy(p => !p)
    }

    const src = useProxy
      ? proxyUrl(movie.subjectId, res, tv ? season : '', tv ? ep : '')
      : streamUrl(movie.subjectId, res, tv ? season : '', tv ? ep : '')

    return (
      <div className="mv-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) close() }}>
        <div className="mv-modal">
          <button className="mv-modal-close" onClick={close} aria-label="Close">✕</button>

          {/* ── Hero ── */}
          <div className="mv-modal-hero">
            <div className="mv-modal-hero-bg" style={{ backgroundImage: 'url(' + poster + ')' }} />
            <div className="mv-modal-hero-grad" />
            <div className="mv-modal-hero-inner">
              <img src={poster} alt={d.title} className="mv-modal-poster"
                onError={e => { e.target.src = 'https://placehold.co/260x390/0d0d1a/8b5cf6?text=🎬' }} />
              <div className="mv-modal-info">
                <div className="mv-modal-badges">
                  <span className="mv-modal-badge mv-badge-purple">{tv ? '📺 Series' : '🎬 Movie'}</span>
                  {d.countryName && <span className="mv-modal-badge mv-badge-blue">📍 {d.countryName}</span>}
                  {d.imdbRatingValue && <span className="mv-modal-badge mv-badge-amber">⭐ {d.imdbRatingValue}</span>}
                </div>
                <h2 className="mv-modal-title">{d.title}</h2>
                <div className="mv-modal-meta">
                  {year(d) && <span>📅 {year(d)}</span>}
                  {dur(d.duration) && <span>⏱ {dur(d.duration)}</span>}
                  {(d.genre || '').split(',').slice(0,3).filter(Boolean).map(g => (
                    <span key={g} style={{ color: '#a78bfa' }}>{g.trim()}</span>
                  ))}
                </div>
                <div style={{ marginTop: '1.1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button className="mv-hero-play-btn"
                    onClick={() => { setPlaying(true); scrollToPlayer() }}>
                    ▶ {tv ? 'Watch Now' : 'Watch Movie'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="mv-modal-body">
            {loading && (
              <div className="mv-spinner"><div className="mv-spin" /><p style={{ color:'#64748b', margin:'0.75rem 0 0', fontSize:'0.85rem' }}>Loading…</p></div>
            )}

            {!loading && (
              <>
                {d.description && <p className="mv-modal-desc">{d.description}</p>}

                {/* ── Episode picker (TV only) ── */}
                {tv && (
                  <div className="mv-episodes-section">
                    <div className="mv-season-head">
                      <h4 className="mv-modal-sub" style={{ margin: 0 }}>
                        Episodes — S{season} E{ep}
                      </h4>
                      {maxSe > 1 && (
                        <div className="mv-season-tabs">
                          {Array.from({ length: maxSe }, (_, i) => i + 1).map(s => (
                            <button key={s}
                              className={'mv-season-tab' + (season === s ? ' active' : '')}
                              onClick={() => { setSeason(s); setEp(1) }}>
                              S{s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={'mv-season-group mv-sc-' + ((season - 1) % 7)}>
                      <div className="mv-ep-grid">
                        {Array.from({ length: epCount }, (_, i) => i + 1).map(e => (
                          <button key={e}
                            className={'mv-ep-btn' + (season === season && ep === e && playing ? ' active' : '')}
                            onClick={() => play(season, e)}>
                            <span className="mv-ep-num">E{e}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Player ── */}
                <div className="mv-player-section">
                  <div className="mv-player-head">
                    <span className="mv-player-label">
                      <span className="mv-player-dot" />
                      {tv ? 'S' + season + ' E' + ep + ' — Stream Now' : 'Full Movie — Stream Now'}
                    </span>
                    <div className="mv-quality-tabs">
                      {RESS.map(r => (
                        <button key={r}
                          className={'mv-quality-btn' + (res === r ? ' active' : '')}
                          onClick={() => { setRes(r); if (playing) setPlaying(false); setTimeout(() => setPlaying(true), 10) }}>
                          {r}p
                        </button>
                      ))}
                    </div>
                  </div>

                  {playing ? (
                    <div className="mv-video-wrap">
                      {/* ── Option A: direct URL, browser sends no Referer ── */}
                      {!useProxy && (
                        <video key={src}
                          className="mv-video"
                          src={src}
                          referrerPolicy="no-referrer"
                          controls autoPlay playsInline preload="metadata"
                        />
                      )}
                      {/* ── Option B: server proxy with Referer + Range ── */}
                      {useProxy && (
                        <video key={src + '-proxy'}
                          className="mv-video"
                          src={src}
                          controls autoPlay playsInline preload="metadata"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="mv-video-wrap mv-video-placeholder"
                      onClick={() => { setPlaying(true); scrollToPlayer() }}>
                      <img src={poster} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.15 }} />
                      <div style={{ position:'relative', zIndex:2, textAlign:'center' }}>
                        <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(139,92,246,0.85)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem', boxShadow:'0 8px 32px rgba(139,92,246,0.5)' }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                        <span className="mv-video-placeholder-icon" style={{ fontSize:'0.95rem', color:'#94a3b8', display:'block' }}>
                          {tv ? 'Select an episode or click to play S' + season + 'E' + ep : 'Click to stream in ' + res + 'p'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Stream info + proxy toggle */}
                  <div style={{ marginTop:'0.75rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.5rem', padding:'0 0.25rem' }}>
                    <span style={{ fontSize:'0.75rem', color:'#475569' }}>
                      🔗 xcasper.space · {res}p{tv ? ' · S'+season+' E'+ep : ''} · {useProxy ? 'server proxy' : 'direct stream'}
                    </span>
                    <button onClick={toggleProxy}
                      style={{ fontSize:'0.72rem', color: useProxy ? '#4ade80' : '#a78bfa', background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:'7px', padding:'0.28rem 0.65rem', cursor:'pointer', fontFamily:'inherit' }}>
                      {useProxy ? '✓ Using proxy' : 'Not loading? Try proxy'}
                    </button>
                  </div>
                </div>

                {/* ── Recommendations ── */}
                {recs.length > 0 && (
                  <div style={{ marginTop:'2.5rem' }}>
                    <h4 className="mv-modal-sub">You May Also Like</h4>
                    <div className="mv-grid">
                      {recs.map(r => (
                        <Card key={r.subjectId} movie={r} onClick={m => { onClose(); setTimeout(() => onSelect(m), 50) }} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ══════════════════════
     Main page
  ══════════════════════ */
  export default function MoviesPage() {
    const [trending,  setTrending]  = useState([])
    const [results,   setResults]   = useState([])
    const [hero,      setHero]      = useState(null)
    const [loading,   setLoading]   = useState(true)
    const [searching, setSearching] = useState(false)
    const [query,     setQuery]     = useState('')
    const [type,      setType]      = useState('')
    const [selected,  setSelected]  = useState(null)

    /* load trending on mount */
    useEffect(() => {
      (async () => {
        try {
          const r = await fetch(API + '?action=trending')
          const d = await r.json()
          const list = d?.data?.subjectList || []
          setTrending(list)
          setHero(list[Math.floor(Math.random() * Math.min(5, list.length))] || list[0] || null)
        } catch {}
        setLoading(false)
      })()
    }, [])

    const handleSearch = useCallback(async e => {
      e?.preventDefault()
      if (!query.trim()) { setResults([]); return }
      setSearching(true)
      try {
        const r = await fetch(API + '?action=search&q=' + encodeURIComponent(query) + (type ? '&type=' + type : ''))
        const d = await r.json()
        setResults(d?.data?.items || d?.data?.subjectList || [])
      } catch {}
      setSearching(false)
    }, [query, type])

    const display   = results.length > 0 ? results : trending
    const isSearch  = results.length > 0

    return (
      <div className="mv-page">
        {/* ── Hero ── */}
        {hero && (
          <div className="mv-hero" style={{ cursor:'pointer' }} onClick={() => setSelected(hero)}>
            <div className="mv-hero-bg" style={{ backgroundImage:'url(' + cover(hero) + ')' }} />
            <div className="mv-hero-gradient" />
            <div className="mv-hero-content">
              <div className="mv-hero-badge">🔥 Trending Now</div>
              <h1 className="mv-hero-title">{hero.title}</h1>
              <div className="mv-hero-meta">
                {year(hero) && <span>📅 {year(hero)}</span>}
                {hero.imdbRatingValue && <span>⭐ {hero.imdbRatingValue}</span>}
                {hero.genre && <span>🎭 {hero.genre.split(',')[0]}</span>}
                <span>{isTV(hero) ? '📺 Series' : '🎬 Movie'}</span>
              </div>
              <div className="mv-hero-btns">
                <button className="mv-hero-play-btn">▶ Play Now</button>
                <button className="mv-hero-info-btn" onClick={e => { e.stopPropagation(); setSelected(hero) }}>ℹ More Info</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Search ── */}
        <div className="mv-search-wrap">
          <form className="mv-search-row" onSubmit={handleSearch}>
            <span className="mv-search-icon">🔍</span>
            <input className="mv-search-input" value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search movies, series…" />
            <select className="mv-search-type" value={type} onChange={e => setType(e.target.value)}>
              <option value="">All</option>
              <option value="1">Movies</option>
              <option value="2">Series</option>
            </select>
            <button type="submit" className="mv-search-btn">Search</button>
          </form>
        </div>

        {/* ── Grid ── */}
        <div className="mv-section">
          <div className="mv-section-head">
            <h2 className="mv-section-title">
              <span className="mv-section-bar" />
              {isSearch ? 'Results for "' + query + '"' : '🔥 Trending'}
            </h2>
            <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
              {isSearch && (
                <button onClick={() => { setResults([]); setQuery('') }}
                  style={{ fontSize:'0.8rem', color:'#a78bfa', background:'none', border:'1px solid rgba(139,92,246,0.3)', borderRadius:'7px', padding:'0.3rem 0.7rem', cursor:'pointer' }}>
                  ✕ Clear
                </button>
              )}
              <span className="mv-count">{display.length} titles</span>
            </div>
          </div>

          <div className="mv-grid">
            {(loading || searching)
              ? Array.from({ length: 20 }).map((_, i) => <Skeleton key={i} />)
              : display.length === 0
                ? <div className="mv-empty"><span className="mv-empty-icon">🎬</span><p>No results found</p></div>
                : display.map(m => <Card key={m.subjectId} movie={m} onClick={setSelected} />)
            }
          </div>
        </div>

        {/* ── Modal ── */}
        {selected && (
          <Modal
            movie={selected}
            onClose={() => setSelected(null)}
            onSelect={setSelected}
          />
        )}
      </div>
    )
  }
  