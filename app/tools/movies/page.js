'use client'
  import { useState, useCallback, useEffect, useRef } from 'react'
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

  /* Secondary manual fallbacks. These third-party embeds can contain advertising. */
  const VS_SERVERS = [
    {
      id: 'vs1', label: 'Server 1',
      movie: id => 'https://vidsrc.to/embed/movie/' + id,
      tv: (id, s, e) => 'https://vidsrc.to/embed/tv/' + id + '/' + s + '/' + e,
    },
    {
      id: 'vs2', label: 'Server 2',
      movie: id => 'https://vidsrc.xyz/embed/movie/' + id,
      tv: (id, s, e) => 'https://vidsrc.xyz/embed/tv/' + id + '?season=' + s + '&episode=' + e,
    },
    {
      id: 'vs3', label: 'Server 3',
      movie: id => 'https://vidsrc.me/embed/movie/' + id,
      tv: (id, s, e) => 'https://vidsrc.me/embed/tv/' + id + '?s=' + s + '&e=' + e,
    },
  ]

  function embedUrl(serverId, imdbId, se, ep) {
    if (!imdbId) return ''
    const server = VS_SERVERS.find(item => item.id === serverId)
    return server ? ((se && ep) ? server.tv(imdbId, se, ep) : server.movie(imdbId)) : ''
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
  function Modal({ movie, onClose, onSelect }) {
    const [detail,   setDetail]   = useState(null)
    const [loadInfo, setLoadInfo] = useState(true)
    const [playData, setPlayData] = useState(null)  /* { imdbId, seasons, isTV } */
    const [recs,     setRecs]     = useState([])
    const [supplemental, setSupplemental] = useState(null)

    /* player */
    const [se,       setSe]       = useState(1)
    const [ep,       setEp]       = useState(1)
    const [res,      setRes]      = useState(720)
    const [playing,  setPlaying]  = useState(false)
    const [player,   setPlayer]   = useState('direct') /* 'direct' | 'proxy' | 'vs1' | 'vs2' | 'vs3' | 'unavailable' */
    const [streamNotice, setStreamNotice] = useState('')
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
      setDetail(null); setPlayData(null); setSupplemental(null); setLoadInfo(true); setPlaying(false)
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

          fetch(API + '?action=metadata&q=' + encodeURIComponent(movie.title || '') + '&kind=' + (isTV(movie) ? 'tv' : 'movie'))
            .then(response => response.ok ? response.json() : null)
            .then(payload => {
              const meta = payload?.data || null
              setSupplemental(meta)
              if (meta?.seasons?.length) setSe(current => meta.seasons.includes(current) ? current : meta.seasons[0])
            })
            .catch(() => {})
        } catch {}
        setLoadInfo(false)
      })()
    }, [movie.subjectId])

    const d       = detail || movie
    const tv      = isTV(d)
    const poster  = cover(d) || supplemental?.poster || ''
    const summary = d.description || supplemental?.summary || ''
    const genres  = (d.genre || supplemental?.genres?.join(',') || '').split(',').map(g => g.trim()).filter(Boolean)
    const rating  = d.imdbRatingValue || supplemental?.rating || null

    /* Prefer provider episode data, then the ShowBox list, then a compact default. */
    const seasons = supplemental?.seasons?.length ? supplemental.seasons : (playData?.seasons?.length ? playData.seasons : (tv ? [1] : []))
    const EP_PER  = 24
    const episodeCount = supplemental?.episodeCounts?.[se] || EP_PER

    function scrollToPlayer() {
      setTimeout(() => document.querySelector('.mv-player-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    }

    function watchEp(s, e) {
      setSe(s); setEp(e); setPlaying(true); setPlayer('direct'); setStreamNotice('')
      scrollToPlayer()
    }

    function watchNow() {
      setPlaying(true); setPlayer('direct'); setStreamNotice('')
      scrollToPlayer()
    }

    /* derive current player src */
    const imdbId = playData?.imdbId || supplemental?.imdbId || null
    const vsSrc  = embedUrl(player, imdbId, tv ? se : null, tv ? ep : null)
    const xcSrc  = xcUrl(movie.subjectId, res, tv ? se : '', tv ? ep : '')
    const pxSrc  = xcProxy(movie.subjectId, res, tv ? se : '', tv ? ep : '')
    const dlSrc  = API + '?action=download&id=' + encodeURIComponent(movie.subjectId) + '&res=' + res + (tv && se && ep ? '&se=' + se + '&ep=' + ep : '')

    function handleCleanStreamFailure() {
      if (player === 'direct') {
        setPlayer('proxy')
        setStreamNotice('Direct stream was unavailable, so Fast Stream is being tried next.')
      } else {
        setPlayer('unavailable')
        setStreamNotice('Clean streams are unavailable. You may manually select a third-party backup below if needed; those providers can show ads.')
      }
    }

    function retryDirectStream() {
      setPlayer('direct')
      setStreamNotice('')
      setPlaying(true)
    }

    function selectBackup(serverId) {
      setPlayer(serverId)
      setStreamNotice('Third-party backup selected. It may show advertisements or external prompts.')
      setPlaying(true)
    }

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
                  {rating && <span className="mv-modal-badge mv-badge-amber">⭐ {rating}</span>}
                  {supplemental?.provider === 'tvmaze' && <span className="mv-modal-badge mv-badge-blue">TV episode guide</span>}
                </div>
                <h2 className="mv-modal-title">{d.title}</h2>
                <div className="mv-modal-meta">
                  {year(d) && <span>📅 {year(d)}</span>}
                  {dur(d.duration) && <span>⏱ {dur(d.duration)}</span>}
                  {genres.slice(0, 3).map(g => (
                    <span key={g} style={{ color: '#a78bfa' }}>{g}</span>
                  ))}
                </div>
                <div style={{ marginTop: '1.1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {!loadInfo && (
                    <button className="mv-hero-play-btn" onClick={watchNow}>
                      ▶ {tv ? 'Watch S' + se + ' E' + ep : 'Watch Movie'}
                    </button>
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
                {summary && <p className="mv-modal-desc">{summary}</p>}
                {supplemental?.provider && <p style={{ margin: '0.45rem 0 1.1rem', color: '#64748b', fontSize: '0.72rem' }}>
                  Metadata enhanced by {supplemental.provider === 'tvmaze' ? 'TVmaze' : 'AllInOne catalogue'}{supplemental?.totalEpisodes ? ' · ' + supplemental.totalEpisodes + ' episodes indexed' : ''}
                </p>}



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
                      { id: 'direct', label: '▶ Direct',      title: 'Direct upstream stream (first choice)' },
                      { id: 'proxy',  label: '⚡ Fast Stream', title: 'Proxied clean-stream fallback' },
                    ].map(opt => (
                      <button key={opt.id} title={opt.title}
                        onClick={() => { setPlayer(opt.id); if (!playing) setPlaying(true) }}
                        style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                          background: player === opt.id ? 'linear-gradient(135deg,#25d366,#16a34a)' : 'rgba(37,211,102,0.08)',
                          color: player === opt.id ? '#fff' : '#4ade80' }}>
                        {opt.label}
                      </button>
                    ))}
                    {imdbId && <span style={{ fontSize: '0.72rem', color: '#475569', marginLeft: '0.25rem' }}>Backup:</span>}
                    {imdbId && VS_SERVERS.map(server => (
                      <button key={server.id} title="Third-party backup; may show ads"
                        onClick={() => selectBackup(server.id)}
                        style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.7rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                          background: player === server.id ? 'rgba(139,92,246,0.8)' : 'rgba(139,92,246,0.08)',
                          color: player === server.id ? '#fff' : '#a78bfa' }}>
                        {server.label}
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
                      {player === 'unavailable' && (
                        <div className="mv-video-placeholder" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                          <span className="mv-video-placeholder-icon">⚠️</span>
                          <p style={{ color: '#e2e8f0', margin: '0.6rem 0 0', fontWeight: 700 }}>Clean stream unavailable</p>
                          <p style={{ color: '#94a3b8', margin: '0.4rem auto 1rem', maxWidth: 420, fontSize: '0.82rem' }}>Direct and Fast Stream were unavailable. You can retry Direct or choose a backup server manually; third-party backups may include ads.</p>
                          <button onClick={retryDirectStream} className="mv-quality-btn active">Retry Direct</button>
                        </div>
                      )}
                      {/* Direct xcasper stream is always tried first. */}
                       {player === 'direct' && (
                         <StableVideo key={xcSrc} src={xcSrc} onFailure={handleCleanStreamFailure} />
                       )}
                      {/* Fast Stream is the automatic clean fallback after Direct fails. */}
                      {player === 'proxy' && (
                        <video key={pxSrc}
                          className="mv-video"
                          src={pxSrc}
                          controls autoPlay playsInline preload="metadata"
                          onError={handleCleanStreamFailure}
                        />
                      )}
                      {/* Advertising-supported providers stay manual secondary options. */}
                      {VS_SERVERS.some(server => server.id === player) && vsSrc && (
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
                      {VS_SERVERS.some(server => server.id === player) && !vsSrc && (
                        <div className="mv-video-placeholder">
                          <span className="mv-video-placeholder-icon">⚠️</span>
                          <p style={{ color: '#94a3b8', margin: '0.5rem 0 0' }}>A backup player is not available for this title.</p>
                        </div>
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

                  <p style={{ fontSize: '0.72rem', color: streamNotice ? '#fbbf24' : '#334155', margin: '0.6rem 0 0', padding: '0 0.25rem' }}>
                    {streamNotice || (player === 'unavailable' ? 'Clean streams unavailable' : player === 'direct' ? '▶ Direct stream · ' + res + 'p (first choice)' : player === 'proxy' ? '⚡ Fast Stream · ' + res + 'p (clean fallback)' : '⚠ Third-party backup · may include ads')}
                    {tv ? ' · S' + se + ' E' + ep : ''}
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
                            else if (se > seasons[0]) { const ps = seasons[seasons.indexOf(se) - 1]; const previousCount = supplemental?.episodeCounts?.[ps] || EP_PER; setSe(ps); setEp(previousCount); watchEp(ps, previousCount) }
                          }}>
                          ← Prev
                        </button>
                        <button className="mv-eps-nav-btn mv-eps-next"
                          onClick={() => {
                            if (ep < episodeCount) { const next = ep + 1; setEp(next); watchEp(se, next) }
                            else { const idx = seasons.indexOf(se); if (idx < seasons.length - 1) { const ns = seasons[idx + 1]; setSe(ns); setEp(1); watchEp(ns, 1) } }
                          }}>
                          Next →
                        </button>
                      </div>
                    </div>
                    {/* Scrollable episode strip */}
                    <div className="mv-eps-strip">
                      {Array.from({ length: episodeCount }, (_, i) => i + 1).map(e => (
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
  export default function MoviesPage() {
    const [trending,  setTrending]  = useState([])
    const [results,   setResults]   = useState([])
    const [hero,      setHero]      = useState(null)
    const [loading,   setLoading]   = useState(true)
    const [searching, setSearching] = useState(false)
    const [query,     setQuery]     = useState('')
    const [type,      setType]      = useState('')
    const [selected,  setSelected]  = useState(null)

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
                <button type="button" className="mv-hero-play-btn" onClick={e => { e.stopPropagation(); setSelected(hero) }}>▶ Play Now</button>
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
 
/* ── StableVideo: auto-resumes xcasper stream on stall or error ── */
function StableVideo({ src, onFailure }) {
  const videoRef = useRef(null)
  const retryRef = useRef(null)
  const stallRef = useRef(null)
  const retryCount = useRef(0)
  const failedRef = useRef(false)

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
    if (retryCount.current < 2) scheduleRetry(1200)
    else if (!failedRef.current) {
      failedRef.current = true
      onFailure?.()
    }
  }

  function handlePlaying() {
    retryCount.current = 0
    clearTimeout(retryRef.current)
    clearTimeout(stallRef.current)
  }

  useEffect(() => {
    failedRef.current = false
    retryCount.current = 0
    return () => {
      clearTimeout(retryRef.current); clearTimeout(stallRef.current)
    }
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

 