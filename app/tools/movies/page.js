'use client'
import Layout from '../../../components/Layout'
import { useState, useEffect, useCallback, useRef } from 'react'
import '../tools.css'
import './movies.css'

export const dynamic = 'force-dynamic'

/* ── Helpers ── */
function fmtDur(secs) {
  if (!secs) return null
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
function fmtSize(bytes) {
  if (!bytes) return ''
  const mb = +bytes / (1024 * 1024)
  return mb > 1000 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`
}
function fmtYear(date) { return date?.slice(0, 4) || '' }
function coverUrl(m) { return m?.cover?.url || m?.cover || '' }

/* ── Trailer helpers ── */
function parseYTId(val) {
  if (!val || typeof val !== 'string') return null
  const c = val.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(c)) return c
  const m = c.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}
function extractTrailer(d) {
  if (!d) return { ytId: null, directUrl: null }
  const ytFields = [
    d.trailerId, d.youtubeTrailerId, d.ytTrailerId,
    d.trailerList?.[0]?.youtubeId, d.trailerList?.[0]?.id,
    d.trailer?.youtubeId, d.trailer?.id,
  ]
  for (const f of ytFields) {
    const id = parseYTId(f)
    if (id) return { ytId: id, directUrl: null }
  }
  const urlFields = [
    d.trailerList?.[0]?.url, d.trailerList?.[0]?.videoUrl,
    d.trailer?.url, d.trailer?.videoUrl, d.trailerUrl,
  ]
  const directUrl = urlFields.find(u => u && typeof u === 'string' && u.startsWith('http')) || null
  return { ytId: null, directUrl }
}

/* ── Movie card ── */
function MovieCard({ movie, onClick }) {
  return (
    <div className="mv-card" onClick={() => onClick(movie)}>
      <div className="mv-poster-wrap">
        <img
          src={coverUrl(movie)}
          alt={movie.title}
          className="mv-poster"
          loading="lazy"
          onError={e => { e.target.src = 'https://placehold.co/300x450/0d0d1a/8b5cf6?text=🎬' }}
        />
        <div className="mv-poster-overlay">
          <div className="mv-play-icon">▶</div>
        </div>
        {movie.imdbRatingValue && (
          <span className="mv-rating-badge">⭐ {movie.imdbRatingValue}</span>
        )}
        <span className="mv-type-badge">{movie.subjectType === 2 ? '📺 Series' : '🎬 Movie'}</span>
      </div>
      <div className="mv-card-info">
        <p className="mv-card-title">{movie.title}</p>
        <div className="mv-card-meta">
          <span className="mv-card-year">{fmtYear(movie.releaseDate)}</span>
          {movie.genre && <span className="mv-card-genre">{movie.genre.split(',')[0].trim()}</span>}
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
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

/* ── Detail modal ── */
function DetailModal({ movie, onClose }) {
  const [detail,         setDetail]        = useState(null)
  const [streams,        setStreams]        = useState([])
    const [seasons,        setSeasons]       = useState([])
    const [activeSeason,   setActiveSeason]  = useState(1)
    const [activeEpNum,    setActiveEpNum]   = useState(1)
    const [proxyTemplate,  setProxyTemplate] = useState('')
    const [epTitles,       setEpTitles]      = useState({})
    const [imdbId,         setImdbId]        = useState(null)
    const [isShowbox,      setIsShowbox]     = useState(false)
  const [recs,           setRecs]          = useState([])
  const [loading,        setLoading]       = useState(true)
  const [activeQ,        setActiveQ]       = useState(null)
  const [playing,        setPlaying]       = useState(false)
  const [trailer,        setTrailer]       = useState({ ytId: null, directUrl: null })
  const [trailerPlaying, setTrailerPlaying]= useState(false)
  const videoRef  = useRef(null)
  const histRef   = useRef(false)
  const trailerRef= useRef(null)

  /* lock scroll + history */
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    window.history.pushState({ mvModal: true }, '')
    histRef.current = true
    const onPop = () => { histRef.current = false; onClose() }
    window.addEventListener('popstate', onPop)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('popstate', onPop)
    }
  }, [onClose])

  const close = useCallback(() => {
    if (histRef.current) { histRef.current = false; window.history.back() }
    else onClose()
  }, [onClose])

  /* fetch detail + streams + recs in parallel */
  useEffect(() => {
    setDetail(null); setStreams([]); setRecs([]); setLoading(true)
    setPlaying(false); setActiveQ(null); setImdbId(null); setIsShowbox(false)
    setTrailer({ ytId: null, directUrl: null }); setTrailerPlaying(false)
    const id = movie.subjectId
    async function load() {
      try {
        const [dRes, pRes, rRes] = await Promise.all([
          fetch(`/api/tools/movies?action=detail&id=${id}`),
          fetch(`/api/tools/movies?action=play&id=${id}`),
          fetch(`/api/tools/movies?action=recommend&id=${id}`),
        ])
        const [dData, pData, rData] = await Promise.all([dRes.json(), pRes.json(), rRes.json()])

        const detailData = dData?.data || null
        setDetail(detailData)
        setTrailer(extractTrailer(detailData))
        if (pData?.data?.isShowbox) setIsShowbox(true)

        // Extract seasons + proxyUrl template for series
        const seasonList = pData?.data?.seasons || []
        if (seasonList.length > 0) {
          setSeasons(seasonList)
          const tmpl = pData?.data?.streams?.[0]?.proxyUrl || ''
          setProxyTemplate(tmpl)
          // xcasper/ShowBox already provides the IMDB ID — set it immediately
          if (pData?.data?.imdbId) setImdbId(pData.data.imdbId)
          // TVMaze: used only for per-season episode counts + episode titles (secondary)
          try {
            const showTitle  = dData?.data?.title || movie.title || ''
            const cleanTitle = showTitle.replace(/\s*S\d.*$/i, '').trim()
            const tvRes  = await fetch('/api/tools/movies?action=tvmaze&q=' + encodeURIComponent(cleanTitle))
            const tvData = await tvRes.json()
            // Use TVMaze IMDB only as a fallback if xcasper didn't provide one
            if (!pData?.data?.imdbId && tvData.imdbId) setImdbId(tvData.imdbId)
            // Build episode title map
            const titleMap = {}
            ;(tvData.episodes || []).forEach(e => { titleMap[e.season + '-' + e.number] = e.name })
            setEpTitles(titleMap)
            // Update seasons with accurate per-season episode counts from TVMaze
            if (tvData.seasonCounts && Object.keys(tvData.seasonCounts).length) {
              setSeasons(prev => prev.map(s => {
                const sNum = s.season ?? s
                const cnt  = tvData.seasonCounts[sNum]
                return typeof s === 'object'
                  ? { ...s, episodes: cnt || s.episodes || 50 }
                  : { season: sNum, episodes: cnt || 50 }
              }))
            } else {
              setSeasons(prev => prev.map(s =>
                typeof s === 'object' ? s : { season: s, episodes: 50 }
              ))
            }
          } catch {
            setSeasons(prev => prev.map(s =>
              typeof s === 'object' ? s : { season: s, episodes: 50 }
            ))
          }
        }

        // Filter out dummy/broken streams; keep valid resolutions only
        // For movies: use bff-stream endpoint directly; for series: keep existing logic
        const isTvSeries = seasonList.length > 0
        let finalStreams = []
        if (!isTvSeries) {
          // Build direct bff-stream quality options (proxied server-side for xcasper.space Referer)
          finalStreams = [360, 480, 720, 1080].map(res => ({
            resolutions: res,
            url: `https://movieapi.xcasper.space/api/bff/stream?subjectId=${id}&resolution=${res}`,
            proxyUrl: `/api/tools/movies?action=bff-stream&id=${encodeURIComponent(id)}&res=${res}`,
            vip_only: 0,
          }))
        } else {
          const st = (pData?.data?.streams || []).filter(s => !s.isEmbed && (+s.resolutions) > 0)
          finalStreams = [...st].sort((a, b) => (+b.resolutions) - (+a.resolutions))
        }
        setStreams(finalStreams)
        const firstFree = finalStreams.find(s => !s.vip_only) || finalStreams[0] || null
        if (firstFree) setActiveQ(firstFree)
        setRecs((rData?.data?.subjectList || []).slice(0, 10))
      } catch {}
      setLoading(false)
    }
    load()
  }, [movie.subjectId])

  const cover = coverUrl(detail || movie)
  const d = detail || movie

  const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent((d.title || '') + ' official trailer')}`

  function selectEpisode(season, ep) {
    setActiveSeason(season)
    setActiveEpNum(ep)
    setPlaying(true)
    // Build bff-stream URLs for this episode (no-referrer direct, or proxied fallback)
    const epStreams = [360, 480, 720, 1080].map(res => ({
      resolutions: res,
      url: `https://movieapi.xcasper.space/api/bff/stream?subjectId=${movie.subjectId}&resolution=${res}&se=${season}&ep=${ep}`,
      proxyUrl: `/api/tools/movies?action=bff-stream&id=${encodeURIComponent(movie.subjectId)}&res=${res}&se=${season}&ep=${ep}`,
      vip_only: 0,
    }))
    setStreams(epStreams)
    setActiveQ(epStreams.find(s => s.resolutions === 720) || epStreams[0])
    setTimeout(() => document.querySelector('.mv-player-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

    function scrollToTrailer() {
    setTrailerPlaying(true)
    setTimeout(() => trailerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  return (
    <div className="mv-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div className="mv-modal">
        <button className="mv-modal-close" onClick={close} aria-label="Close">✕</button>

        {/* ── Hero ── */}
        <div className="mv-modal-hero">
          <div className="mv-modal-hero-bg" style={{ backgroundImage: `url(${cover})` }} />
          <div className="mv-modal-hero-grad" />
          <div className="mv-modal-hero-inner">
            <img src={cover} alt={d.title} className="mv-modal-poster"
              onError={e => { e.target.src = 'https://placehold.co/260x390/0d0d1a/8b5cf6?text=🎬' }} />
            <div className="mv-modal-info">
              <div className="mv-modal-badges">
                <span className="mv-modal-badge mv-badge-purple">
                  {d.subjectType === 2 ? '📺 Series' : '🎬 Movie'}
                </span>
                {d.countryName && <span className="mv-modal-badge mv-badge-blue">📍 {d.countryName}</span>}
                {streams.length > 0
                  ? <span className="mv-modal-badge mv-badge-purple">▶ {streams.length} Qualit{streams.length === 1 ? 'y' : 'ies'}</span>
                  : (seasons.length > 0 && imdbId && <span className="mv-modal-badge mv-badge-purple">▶ Embed Stream</span>)
                }
                {d.imdbRatingValue && <span className="mv-modal-badge mv-badge-amber">⭐ IMDB {d.imdbRatingValue}</span>}
              </div>
              <h2 className="mv-modal-title">{d.title}</h2>
              <div className="mv-modal-meta">
                {fmtYear(d.releaseDate) && <span>📅 {fmtYear(d.releaseDate)}</span>}
                {fmtDur(d.duration)     && <span>⏱ {fmtDur(d.duration)}</span>}
                {d.genre && d.genre.split(',').slice(0, 3).map(g => (
                  <span key={g} style={{ color: '#a78bfa' }}>{g.trim()}</span>
                ))}
              </div>
              {/* Hero action buttons */}
              <div className="mv-modal-hero-actions">
                <button className="mv-modal-trailer-btn" onClick={scrollToTrailer}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
                  Watch Trailer
                </button>
                {(streams.length > 0 || (seasons.length > 0 && imdbId)) && (
                  <button className="mv-modal-watch-btn" onClick={() => { setPlaying(true); setTimeout(() => document.querySelector('.mv-player-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80) }}>
                    ▶ {seasons.length > 0 ? 'Watch Episode 1' : 'Watch Movie'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="mv-modal-body">
          {loading ? (
            <div className="mv-modal-spinner">
              <div className="mv-spin" />
              <p>Loading movie data…</p>
            </div>
          ) : (
            <>
              {/* Description */}
              {d.description && <p className="mv-modal-desc">{d.description}</p>}

              {/* ══ TRAILER SECTION ══ */}
              <div className="mv-trailer-section" ref={trailerRef}>
                <div className="mv-trailer-head">
                  <span className="mv-player-label">
                    <span className="mv-trailer-dot" />
                    Official Trailer
                  </span>
                  <div className="mv-trailer-head-actions">
                    <a
                      href={ytSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mv-trailer-yt-link"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      YouTube
                    </a>
                    {trailer.ytId && (
                      <div className="mv-trailer-dl-qualities">
                        {['360', '480', '720', '1080'].map(q => (
                          <a
                            key={q}
                            href={`/api/tools/movies?action=trailer-dl-yt&ytId=${trailer.ytId}&quality=${q}&title=${encodeURIComponent(d.title || 'trailer')}`}
                            download={`${(d.title || 'trailer').replace(/[^a-zA-Z0-9 ]/g,'').trim() || 'trailer'}_trailer_${q}p.mp4`}
                            className="mv-trailer-dl-btn"
                          >
                            ⬇ {q}p
                          </a>
                        ))}
                      </div>
                    )}
                    {trailer.directUrl && (
                      <a
                        href={`/api/tools/movies?action=trailer-dl&id=${movie.subjectId}&title=${encodeURIComponent(d.title || 'trailer')}`}
                        download={`${(d.title || 'trailer').replace(/[^a-zA-Z0-9 ]/g,'').trim() || 'trailer'}_trailer.mp4`}
                        className="mv-trailer-dl-link"
                      >
                        ⬇ Download
                      </a>
                    )}
                  </div>
                </div>

                {/* Player area */}
                <div className="mv-video-wrap">
                  {trailerPlaying && trailer.ytId ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${trailer.ytId}?autoplay=1&rel=0&modestbranding=1&color=white`}
                      className="mv-video"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      title={`${d.title} – Official Trailer`}
                      style={{ border: 'none' }}
                    />
                  ) : trailerPlaying && trailer.directUrl ? (
                    <video
                      className="mv-video"
                      src={trailer.directUrl}
                      controls
                      autoPlay
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    /* Thumbnail / click-to-play state */
                    <div
                      className="mv-trailer-thumb-wrap"
                      onClick={() => trailer.ytId || trailer.directUrl
                        ? setTrailerPlaying(true)
                        : window.open(ytSearchUrl, '_blank')
                      }
                      role="button"
                      aria-label="Play trailer"
                    >
                      {trailer.ytId ? (
                        <img
                          src={`https://img.youtube.com/vi/${trailer.ytId}/maxresdefault.jpg`}
                          alt={`${d.title} trailer thumbnail`}
                          className="mv-trailer-thumb-img"
                          onError={e => {
                            e.target.src = `https://img.youtube.com/vi/${trailer.ytId}/hqdefault.jpg`
                          }}
                        />
                      ) : (
                        <img
                          src={cover}
                          alt={d.title}
                          className="mv-trailer-thumb-img"
                          style={{ opacity: 0.35 }}
                        />
                      )}
                      <div className="mv-trailer-play-overlay">
                        <div className="mv-trailer-play-circle">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                        <span className="mv-trailer-play-label">
                          {trailer.ytId || trailer.directUrl ? 'Play Trailer' : 'Search Trailer on YouTube'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ══ SEASONS & EPISODES (Series only) ══ */}
                {seasons.length > 0 && (
                  <div className="mv-episodes-section">
                    <h4 className="mv-modal-sub">
                      Episodes
                      <span className="mv-ep-active-label">
                        {activeSeason && activeEpNum ? ` — S${activeSeason} E${activeEpNum}` : ''}
                      </span>
                    </h4>
                    {seasons.map((s, idx) => (
                      <div key={s.season} className={`mv-season-group mv-sc-${idx % 7}`}>
                        {seasons.length > 1 && (
                          <div className="mv-season-label">Season {s.season}</div>
                        )}
                        <div className="mv-ep-grid">
                          {Array.from({ length: s.episodes }, (_, i) => i + 1).map(ep => (
                            <button
                              key={ep}
                              className={`mv-ep-btn${activeSeason === s.season && activeEpNum === ep ? ' active' : ''}`}
                              onClick={() => selectEpisode(s.season, ep)}
                            >
                              <span className="mv-ep-num">E{ep}</span>
                              {epTitles[s.season + '-' + ep] && (
                                <span className="mv-ep-title">{epTitles[s.season + '-' + ep]}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ══ FULL MOVIE / SERIES PLAYER ══ */}
              {(streams.length > 0 || (seasons.length > 0 && imdbId)) ? (
                <div className="mv-player-section">
                  <div className="mv-player-head">
                    <span className="mv-player-label">
                      <span className="mv-player-dot" />
                      {seasons.length > 0 ? `S${activeSeason} E${activeEpNum} — Stream Now` : 'Full Movie — Stream Now'}
                    </span>
                    {/* Quality tabs only for direct-file streams */}
                    {streams.length > 0 && (
                      <div className="mv-quality-tabs">
                        {streams.map(s => {
                          const label = s.resolutions >= 2160 ? '4K' : `${s.resolutions}p`
                          const isVip = !!s.vip_only
                          const isActive = activeQ?.resolutions === s.resolutions
                          return (
                            <button
                              key={s.resolutions}
                              className={`mv-quality-btn${isActive ? ' active' : ''}${isVip ? ' mv-quality-vip' : ''}`}
                              onClick={() => { if (!isVip) { setActiveQ(s); setPlaying(true) } }}
                              title={isVip ? `${label} — VIP only` : `Play in ${label}`}
                              style={isVip ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
                            >
                              {label}{isVip ? ' 🔒' : ''}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {playing ? (
                    <div className="mv-video-wrap">
                      {/* TV series: use VidSrc embed when IMDB ID is available */}
                      {activeQ ? (
                        <video
                          ref={videoRef}
                          key={activeQ.resolutions + '_' + movie.subjectId}
                          className="mv-video"
                          controls
                          autoPlay
                          playsInline
                          preload="metadata"
                          referrerPolicy="no-referrer"
                          src={activeQ.url || activeQ.proxyUrl}
                        />
                      ) : null}
                    </div>
                  ) : (
                    <div className="mv-video-wrap" style={{ cursor: 'pointer' }}
                      onClick={() => setPlaying(true)}>
                      <div className="mv-trailer-thumb-wrap">
                        <img src={cover} alt="" className="mv-trailer-thumb-img" style={{ opacity: 0.25 }} />
                        <div className="mv-trailer-play-overlay">
                          <div className="mv-trailer-play-circle" style={{ background: 'rgba(139,92,246,0.85)' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                          </div>
                          <span className="mv-trailer-play-label">
                            {seasons.length > 0
                              ? `Click to stream — S${activeSeason} E${activeEpNum}`
                              : `Click to play — ${activeQ?.resolutions >= 2160 ? '4K' : `${activeQ?.resolutions}p`} available`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mv-player-section">
                  <div className="mv-video-placeholder" style={{ padding: '2.5rem', minHeight: 120 }}>
                    <span className="mv-video-placeholder-icon">🔒</span>
                    <p>Free stream not available for this title.</p>
                    {seasons.length > 0 && !imdbId && (
                      <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#94a3b8' }}>
                        This series may not be in our stream index. Try searching on YouTube or your streaming service.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ══ DOWNLOADS (free streams only) ══ */}
              {streams.filter(s => !s.vip_only && s.url).length > 0 && (
                <div className="mv-download-section">
                  <div className="mv-download-head">
                      {seasons.length > 0 ? `⬇ Download — S${activeSeason} E${activeEpNum}` : '⬇ Download Full Movie'}
                    </div>
                    <div className="mv-download-grid">
                      {streams.filter(s => !s.vip_only && s.url).map(s => {
                        const isSeries  = seasons.length > 0
                        const resLabel  = s.resolutions >= 2160 ? '4K' : `${s.resolutions}p`
                        const safeTitle = (d.title || 'movie').replace(/[^a-zA-Z0-9 ]/g,'').trim().replace(/\s+/g,'_')
                        const filename  = isSeries
                          ? `${safeTitle}_S${activeSeason}_E${activeEpNum}_${resLabel}.mp4`
                          : `${safeTitle}_${resLabel}.mp4`
                        const href = isSeries
                          ? `/api/tools/movies?action=download&id=${movie.subjectId}&res=${s.resolutions}&title=${encodeURIComponent(d.title || 'movie')}&se=${activeSeason}&ep=${activeEpNum}`
                          : `/api/tools/movies?action=download&id=${movie.subjectId}&res=${s.resolutions}&title=${encodeURIComponent(d.title || 'movie')}`
                        return (
                          <a
                            key={s.resolutions}
                            href={href}
                            download={filename}
                            className="mv-download-btn"
                          >
                            <span>⬇</span>
                            <span>{resLabel}</span>
                            {s.size && <span className="mv-download-size">{s.size}</span>}
                          </a>
                        )
                      })}
                    </div>
                </div>
              )}

              {/* Cast */}
              {detail?.staffList?.length > 0 && (
                <div className="mv-cast-section">
                  <h4 className="mv-modal-sub">Cast & Crew</h4>
                  <div className="mv-cast-list">
                    {detail.staffList.slice(0, 12).map((s, i) => (
                      <div key={i} className="mv-cast-chip">
                        <strong>{s.name}</strong>
                        {s.role && <> · {s.role}</>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtitles */}
              {d.subtitles && (
                <div style={{ marginBottom: '1.75rem' }}>
                  <h4 className="mv-modal-sub">Subtitles</h4>
                  <div className="mv-subs-list">
                    {d.subtitles.split(',').slice(0, 10).map(s => (
                      <span key={s} className="mv-sub-chip">{s.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {recs.length > 0 && (
                <div>
                  <h4 className="mv-modal-sub">You May Also Like</h4>
                  <div className="mv-recommend-grid">
                    {recs.map(r => (
                      <MovieCard key={r.subjectId} movie={r} onClick={() => {
                        close()
                        setTimeout(() => window.dispatchEvent(
                          new CustomEvent('mv-open', { detail: r })
                        ), 220)
                      }} />
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
   MAIN PAGE
══════════════════════ */
export default function MoviesPage() {
  const [featured, setFeatured]   = useState(null)
  const [trending, setTrending]   = useState([])
  const [results,  setResults]    = useState([])
  const [query,    setQuery]      = useState('')
  const [type,     setType]       = useState('')
  const [tab,      setTab]        = useState('trending')
  const [loading,  setLoading]    = useState(true)
  const [srchLoad, setSrchLoad]   = useState(false)
  const [selected, setSelected]   = useState(null)
  const debRef     = useRef(null)
  const inputRef   = useRef(null)

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/tools/movies?action=trending')
        const data = await res.json()
        const list = data?.data?.subjectList || []
        if (list.length) { setFeatured(list[0]); setTrending(list) }
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const h = e => setSelected(e.detail)
    window.addEventListener('mv-open', h)
    return () => window.removeEventListener('mv-open', h)
  }, [])

  const runSearch = useCallback(async (q, t) => {
    if (!q.trim()) { setResults([]); setTab('trending'); return }
    setSrchLoad(true); setTab('search')
    try {
      const res  = await fetch(`/api/tools/movies?action=search&q=${encodeURIComponent(q)}&type=${t}`)
      const data = await res.json()
      setResults(data?.data?.items || [])
    } catch {}
    setSrchLoad(false)
  }, [])

  const handleInput = (v) => {
    setQuery(v)
    clearTimeout(debRef.current)
    if (!v.trim()) { setResults([]); setTab('trending'); return }
    debRef.current = setTimeout(() => runSearch(v, type), 500)
  }

  const handleTypeChange = (v) => {
    setType(v)
    if (query.trim()) runSearch(query, v)
  }

  const movieList = tab === 'search' ? results : trending

  return (
    <Layout>
      <div className="mv-page">

        {/* ── Hero banner ── */}
        {featured && (
          <div className="mv-hero">
            <div className="mv-hero-bg" style={{ backgroundImage: `url(${coverUrl(featured)})` }} />
            <div className="mv-hero-gradient" />
            <div className="mv-hero-content">
              <span className="mv-hero-badge">🎬 Featured Today</span>
              <h1 className="mv-hero-title">{featured.title}</h1>
              <div className="mv-hero-meta">
                {featured.imdbRatingValue && <span>⭐ {featured.imdbRatingValue} IMDB</span>}
                {fmtDur(featured.duration) && <span>⏱ {fmtDur(featured.duration)}</span>}
                {featured.genre && <span>🎭 {featured.genre.split(',').slice(0, 2).join(' · ')}</span>}
                {featured.countryName && <span>📍 {featured.countryName}</span>}
              </div>
              {featured.description && (
                <p className="mv-hero-desc">{featured.description}</p>
              )}
              <div className="mv-hero-btns">
                <button className="mv-hero-play-btn" onClick={() => setSelected(featured)}>
                  ▶ Watch Now
                </button>
                <button className="mv-hero-trailer-btn" onClick={() => setSelected(featured)}>
                  🎬 Trailer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Search bar ── */}
        <div className="mv-search-wrap">
          <div className="mv-search-row">
            <span className="mv-search-icon">🔍</span>
            <input
              ref={inputRef}
              className="mv-search-input"
              type="text"
              placeholder="Search movies, TV series, actors…"
              value={query}
              onChange={e => handleInput(e.target.value)}
              autoComplete="off"
            />
            <select
              className="mv-search-type"
              value={type}
              onChange={e => handleTypeChange(e.target.value)}
            >
              <option value="">All</option>
              <option value="1">Movies</option>
              <option value="2">TV Series</option>
            </select>
            <button className="mv-search-btn" onClick={() => runSearch(query, type)}>
              Search
            </button>
          </div>
        </div>

        {/* ── Content section ── */}
        <div className="mv-section">
          <div className="mv-section-head">
            <h2 className="mv-section-title">
              <span className="mv-section-bar" />
              {tab === 'search'
                ? `Results for "${query}"`
                : '🔥 Trending Now'}
            </h2>
            {movieList.length > 0 && (
              <span className="mv-count">{movieList.length} title{movieList.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          <div className="mv-grid">
            {(loading || srchLoad) ? (
              Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
            ) : movieList.length === 0 ? (
              <div className="mv-empty">
                <span className="mv-empty-icon">{tab === 'search' ? '🔍' : '🎬'}</span>
                {tab === 'search'
                  ? `No results for "${query}" — try a different title.`
                  : 'No movies loaded. Please refresh.'}
              </div>
            ) : (
              movieList.map(m => (
                <MovieCard key={m.subjectId} movie={m} onClick={setSelected} />
              ))
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="mv-made-by">
          Toosii Movies · Made by <a href="/">TOOSII</a> · Toosii Tech Kenya
        </div>
      </div>

      {selected && (
        <DetailModal
          movie={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </Layout>
  )
}
