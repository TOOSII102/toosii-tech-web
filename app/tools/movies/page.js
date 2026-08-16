'use client'
  import { useState, useCallback, useEffect, useRef } from 'react'
  import { shareOrCopy } from '../../../lib/clientShare'
  import '../tools.css'
  import './movies.css'

  const API  = '/api/tools/movies'
  const XCSP = 'https://movieapi.xcasper.space/api/bff/stream'
  const RESS = [1080, 720, 480, 360]

  /* ── utils ── */
  const cover  = m => m?.cover?.url || m?.cover || ''
  const year   = m => (m?.releaseDate || '').slice(0, 4)
  const dur    = s => { if (!s) return ''; const h = Math.floor(s/3600), m = Math.floor((s%3600)/60); return h ? h+'h '+m+'m' : m+'m' }
  const isTV   = m => (m?.subjectType || 1) === 2

  /* VidSrc server list — each uses different scrapers/sources */
  const VS_SERVERS = [
    {
      id:    'vs1',
      label: 'Server 1',
      movie: id        => 'https://vidsrc.to/embed/movie/' + id,
      tv:    (id,s,e)  => 'https://vidsrc.to/embed/tv/' + id + '/' + s + '/' + e,
    },
    {
      id:    'vs2',
      label: 'Server 2',
      movie: id        => 'https://vidsrc.xyz/embed/movie/' + id,
      tv:    (id,s,e)  => 'https://vidsrc.xyz/embed/tv/' + id + '?season=' + s + '&episode=' + e,
    },
    {
      id:    'vs3',
      label: 'Server 3',
      movie: id        => 'https://vidsrc.me/embed/movie/' + id,
      tv:    (id,s,e)  => 'https://vidsrc.me/embed/tv/' + id + '?s=' + s + '&e=' + e,
    },
  ]

  function embedUrl(serverId, imdbId, se, ep) {
    if (!imdbId) return ''
    const srv = VS_SERVERS.find(s => s.id === serverId) || VS_SERVERS[0]
    return (se && ep) ? srv.tv(imdbId, se, ep) : srv.movie(imdbId)
  }

  /* Build xcasper direct URL (Option A — no-referrer) */
  function xcUrl(subjectId, res, se, ep) {
    let u = XCSP + '?subjectId=' + encodeURIComponent(subjectId) + '&resolution=' + res
    if (se && ep) u += '&se=' + se + '&ep=' + ep
    return u
  }

  /* Build xcasper proxy URL (Option B) */
  function xcProxy(subjectId, res, se, ep) {
    let u = API + '?action=stream&id=' + encodeURIComponent(subjectId) + '&res=' + res
    if (se && ep) u += '&se=' + se + '&ep=' + ep
    return u
  }

  /* Build xcasper download URL */
  function xcDownload(subjectId, res, se, ep) {
    let u = API + '?action=download&id=' + encodeURIComponent(subjectId) + '&res=' + res
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

  /* ── Detail + Player modal ── */
  function Modal({ movie, onClose, onSelect, onShare }) {
    const [detail,   setDetail]   = useState(null)
    const [loadInfo, setLoadInfo] = useState(true)
    const [playData, setPlayData] = useState(null)  /* { imdbId, seasons, isTV } */
    const [recs,     setRecs]     = useState([])

    /* player */
    const [se,       setSe]       = useState(1)
    const [ep,       setEp]       = useState(1)
    const [res,      setRes]      = useState(720)
    const [playing,  setPlaying]  = useState(false)
    const [player,   setPlayer]   = useState('direct') /* 'direct' | 'proxy' | 'vs1'|'vs2'|'vs3' */
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

    /* fetch detail + play data in parallel */
    useEffect(() => {
      setDetail(null); setPlayData(null); setLoadInfo(true); setPlaying(false)
      const sid = movie.subjectId
      ;(async () => {
        try {
          const [dR, pR, rR] = await Promise.all([
            fetch(API + '?action=detail&id='    + sid),
            fetch(API + '?action=play&id='      + sid),
            fetch(API + '?action=recommend&id=' + sid),
          ])
          const [dD, pD, rD] = await Promise.all([dR.json(), pR.json(), rR.json()])
          setDetail(dD?.data || null)
          setPlayData(pD?.data || null)
          setRecs((rD?.data?.subjectList || rD?.data?.items || []).slice(0, 12))
        } catch {}
        setLoadInfo(false)
      })()
    }, [movie.subjectId])

    const d      = detail || movie
    const tv     = isTV(d)
    const poster = cover(d)

    /* season list: from ShowBox if available, else [1] */
    const seasons = playData?.seasons?.length ? playData.seasons : (tv ? [1] : [])
    const EP_PER  = 24  /* show 24 episode buttons per season */

    function scrollToPlayer() {
      setTimeout(() => document.querySelector('.mv-player-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    }

    function watchEp(s, e) {
      setSe(s); setEp(e); setPlaying(true); setPlayer('direct')
      scrollToPlayer()
    }

    function watchNow() {
      setPlaying(true); setPlayer('direct')
      scrollToPlayer()
    }

    /* derive current player src */
    const imdbId  = playData?.imdbId || null
    const vsSrc   = imdbId ? embedUrl(player, imdbId, tv ? se : null, tv ? ep : null) : null
    const xcSrc  = xcUrl(movie.subjectId, res, tv ? se : '', tv ? ep : '')
    const pxSrc  = xcProxy(movie.subjectId, res, tv ? se : '', tv ? ep : '')
    const dlSrc  = API + '?action=download&id=' + encodeURIComponent(movie.subjectId) + '&res=' + res + (tv && se && ep ? '&se=' + se + '&ep=' + ep : '')

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
                  {(d.genre || '').split(',').slice(0, 3).filter(Boolean).map(g => (
                    <span key={g} style={{ color: '#a78bfa' }}>{g.trim()}</span>
                  ))}
                </div>
                <div style={{ marginTop: '1.1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {!loadInfo && (
                    <>
                      <button className="mv-hero-play-btn" onClick={watchNow}>
                        ▶ {tv ? 'Watch S' + se + ' E' + ep : 'Watch Movie'}
                      </button>
                      {onShare && <button className="mv-hero-info-btn" onClick={() => onShare(movie)}>↗ Share</button>}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="mv-modal-body">
            {loadInfo && (
              <div className="mv-spinner">
                <div className="mv-spin" />
                <p style={{ color: '#64748b', margin: '0.75rem 0 0', fontSize: '0.85rem' }}>Loading…</p>
              </div>
            )}

            {!loadInfo && (
              <>
                {d.description && <p className="mv-modal-desc">{d.description}</p>}



                {/* ── Player ── */}
                <div className="mv-player-section">
                  <div className="mv-player-head">
                    <span className="mv-player-label">
                      <span className="mv-player-dot" />
                      {tv ? 'S' + se + ' E' + ep + ' — Stream Now' : 'Full Movie — Stream Now'}
                    </span>
                  </div>

                  {/* Player source tabs */}
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#475569', marginRight: '0.25rem' }}>Player:</span>
                    {[
                      { id: 'direct', label: '⚡ Direct',  title: 'Direct xcasper stream' },
                      { id: 'proxy',  label: '▶ Stream',  title: 'Ad-free native player (recommended)' },
                    ].map(opt => (
                      <button key={opt.id} title={opt.title}
                        onClick={() => { setPlayer(opt.id); if (!playing) setPlaying(true) }}
                        style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                          background: player === opt.id ? 'linear-gradient(135deg,#25d366,#16a34a)' : 'rgba(37,211,102,0.08)',
                          color: player === opt.id ? '#fff' : '#4ade80' }}>
                        {opt.label}
                      </button>
                    ))}
                    {imdbId && (
                      <span style={{ fontSize: '0.72rem', color: '#475569', marginLeft: '0.25rem' }}>Backup:</span>
                    )}
                    {imdbId && VS_SERVERS.map(srv => (
                      <button key={srv.id} title="Embedded player (may have ads)"
                        onClick={() => { setPlayer(srv.id); if (!playing) setPlaying(true) }}
                        style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.7rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                          background: player === srv.id ? 'rgba(139,92,246,0.8)' : 'rgba(139,92,246,0.08)',
                          color: player === srv.id ? '#fff' : '#a78bfa' }}>
                        {srv.label}
                      </button>
                    ))}
                  </div>
                  {/* Quality + Download row */}
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.9rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#475569', marginRight: '0.25rem' }}>Quality:</span>
                    {RESS.map(r => (
                      <button key={r} className={'mv-quality-btn' + (res === r ? ' active' : '')}
                        onClick={() => setRes(r)}>
                        {r}p
                      </button>
                    ))}
                    <DlButton xcSrc={xcSrc} res={res} />
                  </div>

                  {playing ? (
                    <div className="mv-video-wrap">
                      {/* VidSrc embed iframes (Server 1/2/3) */}
                      {VS_SERVERS.some(s => s.id === player) && vsSrc && (
                        <iframe
                          key={vsSrc}
                          src={vsSrc}
                          className="mv-video"
                          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                          allowFullScreen
                          referrerPolicy="origin"
                          style={{ border: 'none' }}
                        />
                      )}
                      {VS_SERVERS.some(s => s.id === player) && !vsSrc && (
                        <div className="mv-video-placeholder">
                          <span className="mv-video-placeholder-icon">⚠️</span>
                          <p style={{ color: '#94a3b8', margin: '0.5rem 0 0' }}>IMDB ID not found for this title</p>
                        </div>
                      )}
                      {/* xcasper direct — auto-retry on stall/error */}
                       {player === 'direct' && (
                         <StableVideo key={xcSrc} src={xcSrc} />
                       )}
                      {/* xcasper proxy — Option B, Range-aware */}
                      {player === 'proxy' && (
                        <video key={pxSrc}
                          className="mv-video"
                          src={pxSrc}
                          controls autoPlay playsInline preload="metadata"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="mv-video-wrap mv-video-placeholder" onClick={watchNow}
                      style={{ cursor: 'pointer' }}>
                      <img src={poster} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.12 }} />
                      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(139,92,246,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 8px 32px rgba(139,92,246,0.5)' }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                        <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                          {tv ? 'Select an episode or click to play S' + se + 'E' + ep : 'Click to stream'}
                        </span>
                      </div>
                    </div>
                  )}

                  <p style={{ fontSize: '0.72rem', color: '#334155', margin: '0.6rem 0 0', padding: '0 0.25rem' }}>
                    {player === 'vidsrc' ? '▶ VidSrc stream' : player === 'direct' ? '⚡ Direct xcasper · ' + res + 'p (no-referrer)' : '🔀 Proxy xcasper · ' + res + 'p'}
                    {tv ? ' · S' + se + ' E' + ep : ''}
                    {VS_SERVERS.some(s => s.id === player) && !imdbId && ' · IMDB ID unavailable for this title'}
                  </p>
                </div>

                {/* ── Episodes (below player) ── */}
                {tv && seasons.length > 0 && (
                  <div className="mv-eps-panel">
                    {/* Header row: title + season tabs + prev/next */}
                    <div className="mv-eps-head">
                      <div className="mv-eps-title">
                        <span className="mv-player-dot" />
                        Season
                        <div className="mv-eps-seasons">
                          {seasons.map(s => (
                            <button key={s}
                              className={'mv-eps-season-btn' + (se === s ? ' active' : '')}
                              onClick={() => { setSe(s); setEp(1) }}>
                              S{s}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mv-eps-nav">
                        <span className="mv-eps-now">S{se} · E{ep}</span>
                        <button className="mv-eps-nav-btn"
                          disabled={ep <= 1 && se <= seasons[0]}
                          onClick={() => {
                            if (ep > 1) { const next = ep - 1; setEp(next); watchEp(se, next) }
                            else if (se > seasons[0]) { const ps = seasons[seasons.indexOf(se) - 1]; setSe(ps); setEp(EP_PER); watchEp(ps, EP_PER) }
                          }}>
                          ← Prev
                        </button>
                        <button className="mv-eps-nav-btn mv-eps-next"
                          onClick={() => {
                            if (ep < EP_PER) { const next = ep + 1; setEp(next); watchEp(se, next) }
                            else { const idx = seasons.indexOf(se); if (idx < seasons.length - 1) { const ns = seasons[idx + 1]; setSe(ns); setEp(1); watchEp(ns, 1) } }
                          }}>
                          Next →
                        </button>
                      </div>
                    </div>
                    {/* Scrollable episode strip */}
                    <div className="mv-eps-strip">
                      {Array.from({ length: EP_PER }, (_, i) => i + 1).map(e => (
                        <button key={e}
                          className={'mv-eps-ep' + (ep === e && playing ? ' active' : '')}
                          onClick={() => watchEp(se, e)}>
                          <span className="mv-eps-ep-num">E{e}</span>
                          <span className="mv-eps-ep-label">Episode {e}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Recommendations ── */}
                {recs.length > 0 && (
                  <div style={{ marginTop: '2.5rem' }}>
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
  export default function MoviesPage({ shared = null }) {
    const [trending,  setTrending]  = useState([])
    const [results,   setResults]   = useState([])
    const [hero,      setHero]      = useState(null)
    const [loading,   setLoading]   = useState(true)
    const [searching, setSearching] = useState(false)
    const [query,     setQuery]     = useState('')
    const [type,      setType]      = useState('')
    const [selected,  setSelected]  = useState(null)
    const sharedLoaded = useRef(false)

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

    useEffect(() => {
      if (!shared || sharedLoaded.current) return
      sharedLoaded.current = true

      if (shared.query) {
        setQuery(shared.query)
        setSearching(true)
        fetch(API + '?action=search&q=' + encodeURIComponent(shared.query) + (shared.type ? '&type=' + encodeURIComponent(shared.type) : ''))
          .then(r => r.json())
          .then(d => setResults(d?.data?.items || d?.data?.subjectList || []))
          .catch(() => {})
          .finally(() => setSearching(false))
      }

      if (shared.id) {
        setSelected({
          subjectId: shared.id,
          title: shared.title || 'Shared title',
          cover: shared.cover ? { url: shared.cover } : '',
          subjectType: Number(shared.type) || 1,
        })
      }
    }, [shared])

    const shareMovie = async (movie = selected) => {
      if (!movie?.subjectId) return
      const link = new URL('/tools/movies/watch', window.location.origin)
      link.searchParams.set('id', movie.subjectId)
      link.searchParams.set('title', movie.title || 'Shared movie')
      if (cover(movie)) link.searchParams.set('cover', cover(movie))
      if (movie.subjectType) link.searchParams.set('type', movie.subjectType)
      await shareOrCopy({ title: `${movie.title || 'Movie'} — Toosii Tech`, text: `Watch ${movie.title || 'this title'} on Toosii Tech`, url: link.toString() })
    }

    const shareMovieSearch = async () => {
      if (!query.trim()) return
      const link = new URL('/tools/movies/watch', window.location.origin)
      link.searchParams.set('q', query.trim())
      if (type) link.searchParams.set('type', type)
      await shareOrCopy({ title: `Search movies for ${query.trim()} — Toosii Tech`, text: `Browse movie results for ${query.trim()}`, url: link.toString() })
    }

    const display  = results.length > 0 ? results : trending
    const isSearch = results.length > 0

    return (
      <div className="mv-page">
        {/* ── Hero ── */}
        {hero && (
          <div className="mv-hero" style={{ cursor: 'pointer' }} onClick={() => setSelected(hero)}>
            <div className="mv-hero-bg" style={{ backgroundImage: 'url(' + cover(hero) + ')' }} />
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
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {isSearch && (
                                  <button onClick={() => { setResults([]); setQuery('') }}

                  style={{ fontSize: '0.8rem', color: '#a78bfa', background: 'none', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '7px', padding: '0.3rem 0.7rem', cursor: 'pointer' }}>
                  ✕ Clear
                </button>
              )}
              {isSearch && <button onClick={shareMovieSearch} className="mv-share-search-btn">↗ Share Search</button>}
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
            onShare={shareMovie}
          />
        )}
      </div>
    )
  }
 
/* ── StableVideo: auto-resumes xcasper stream on stall or error ── */
function StableVideo({ src }) {
  const videoRef = useRef(null)
  const retryRef = useRef(null)
  const stallRef = useRef(null)
  const retryCount = useRef(0)

  function scheduleRetry(delay = 2000) {
    clearTimeout(retryRef.current)
    retryRef.current = setTimeout(() => {
      const v = videoRef.current
      if (!v) return
      const t = v.currentTime
      v.load()
      v.currentTime = t
      v.play().catch(() => {})
      retryCount.current++
    }, delay)
  }

  function handleStall() {
    clearTimeout(stallRef.current)
    stallRef.current = setTimeout(() => {
      const v = videoRef.current
      if (!v || v.paused) return
      scheduleRetry(1500)
    }, 5000) // wait 5s of stall before retry
  }

  function handleError() {
    if (retryCount.current < 5) scheduleRetry(2000)
  }

  function handlePlaying() {
    retryCount.current = 0
    clearTimeout(retryRef.current)
    clearTimeout(stallRef.current)
  }

  useEffect(() => () => {
    clearTimeout(retryRef.current); clearTimeout(stallRef.current)
  }, [src])

  return (
    <video
      ref={videoRef}
      className="mv-video"
      src={src}
      referrerPolicy="no-referrer"
      controls autoPlay playsInline preload="auto"
      onError={handleError}
      onStalled={handleStall}
      onWaiting={handleStall}
      onPlaying={handlePlaying}
    />
  )
}


/* ── Browser-side download: fetches directly from xcasper so no server proxy needed ── */
function DlButton({ xcSrc, res }) {
  const [dlState, setDlState] = useState('idle') // 'idle' | 'loading' | 'error'
  const [pct, setPct] = useState(0)

  async function handleDownload() {
    setDlState('loading'); setPct(0)
    try {
      const resp = await fetch(xcSrc, {
        headers: { Accept: 'video/mp4,video/*,*/*', 'Referer': 'https://xcasper.space/' },
      })
      if (!resp.ok) throw new Error('Source returned ' + resp.status + '. It may be temporarily down.')

      const contentType = resp.headers.get('content-type') || ''
      if (!contentType.includes('video') && !contentType.includes('octet-stream')) {
        throw new Error('Stream provider is currently down. Try again later.')
      }

      const total = parseInt(resp.headers.get('content-length') || '0', 10)
      const reader = resp.body.getReader()
      const chunks = []
      let loaded = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        loaded += value.length
        if (total) setPct(Math.round((loaded / total) * 100))
      }
      const blob = new Blob(chunks, { type: 'video/mp4' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = `movie-${res}p.mp4`
      document.body.appendChild(a); a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 10000)
      setDlState('idle'); setPct(0)
    } catch (err) {
      setDlState('error')
      setTimeout(() => setDlState('idle'), 4000)
    }
  }

  const label = dlState === 'loading'
    ? (pct > 0 ? `⬇ ${pct}%` : '⬇ …')
    : dlState === 'error'
    ? '✕ Unavailable'
    : `⬇ Download ${res}p`

  const borderColor = dlState === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(37,211,102,0.3)'
  const bgColor     = dlState === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(37,211,102,0.08)'
  const txtColor    = dlState === 'error' ? '#f87171' : '#4ade80'

  return (
    <button onClick={handleDownload} disabled={dlState === 'loading'}
      style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.85rem',
        borderRadius: '8px', border: '1px solid ' + borderColor, cursor: dlState === 'loading' ? 'wait' : 'pointer',
        fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        background: bgColor, color: txtColor, transition: 'all 0.2s', minWidth: '7rem', justifyContent: 'center' }}>
      {label}
    </button>
  )
}

 