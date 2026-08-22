'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { shareOrCopy } from '../../../lib/clientShare'
import { isInMyList, recordDownload, recordWatched, toggleMyList } from '../../../lib/clientMediaState'
import '../tools.css'
import './movies.css'

const API = '/api/tools/movies'
const RESOLUTIONS = [1080, 720, 480, 360]
const PLACEHOLDER = 'https://placehold.co/300x450/0d0d1a/8b5cf6?text=Toosii'
const CLIENT_CACHE_TTL = 60 * 1000
const CLIENT_CACHE_MAX = 150
const MAX_AUTO_STREAM_RETRIES = 3
const STREAM_STALL_TIMEOUT = 8000
const STREAM_INITIAL_LOAD_TIMEOUT = 20000
const DOWNLOAD_CHECK_TIMEOUT = 20000
const clientMetadataCache = new Map()

const putClientMetadata = (url, payload) => {
  if (!clientMetadataCache.has(url) && clientMetadataCache.size >= CLIENT_CACHE_MAX) {
    const oldestKey = clientMetadataCache.keys().next().value
    if (oldestKey) clientMetadataCache.delete(oldestKey)
  }
  clientMetadataCache.set(url, { payload, expiresAt: Date.now() + CLIENT_CACHE_TTL })
}
const CACHEABLE_ACTIONS = new Set(['trending', 'hot', 'home', 'movie-popular', 'movie-new', 'movie-top', 'tv-popular', 'tv-trending', 'tv-new', 'anime-home', 'anime-trending', 'anime-browse', 'live', 'search', 'suggest', 'detail', 'movie-info', 'tv-info', 'play', 'seasons', 'tv-seasons', 'recommend', 'movie-recommend', 'tv-recommend', 'trailer', 'cast', 'dubs', 'captions'])

const request = async (action, params = {}) => {
  const query = new URLSearchParams({ action })
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  })
  const url = API + '?' + query.toString()
  const cacheable = CACHEABLE_ACTIONS.has(action)
  const cached = cacheable ? clientMetadataCache.get(url) : null
  if (cached && cached.expiresAt > Date.now()) return cached.payload
  try {
    const response = await fetch(url)
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      const error = new Error(payload?.error || 'Movies service unavailable')
      error.status = response.status
      error.retryable = Boolean(payload?.retryable || response.status >= 500)
      throw error
    }
    if (cacheable) putClientMetadata(url, payload)
    return payload
  } catch (error) {
    if (cached) return cached.payload
    throw error
  }
}

const cover = movie => movie?.cover?.url || movie?.cover || PLACEHOLDER
const year = movie => String(movie?.releaseDate || '').slice(0, 4)
const isTV = movie => Number(movie?.subjectType || 1) === 2
const isAnime = movie => String(movie?.mediaKind || '').toLowerCase() === 'anime' || String(movie?.genre || '').toLowerCase().split(',').map(value => value.trim()).includes('anime')
const isLive = movie => String(movie?.mediaKind || '').toLowerCase() === 'live' || Number(movie?.subjectType || 0) === 9
const mediaKind = movie => isLive(movie) ? 'live' : isAnime(movie) ? 'anime' : ''
const duration = value => {
  if (!value) return ''
  const seconds = Number(value)
  if (!Number.isFinite(seconds)) return String(value)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`
}

function positionedTitle(title, season, episode) {
  const base = String(title || 'Shared movie').trim()
  if (!season) return base
  const hasSeason = new RegExp(`\\bS${season}\\b`, 'i').test(base)
  const hasEpisode = !episode || new RegExp(`\\bE${episode}\\b`, 'i').test(base)
  return `${base}${!hasSeason ? ` S${season}` : ''}${episode && !hasEpisode ? ` E${episode}` : ''}`
}

function mediaUrl(id, resolution, season, episode, action = 'stream', title = '', kind = '', retry = 0) {
  const params = new URLSearchParams({ action, id: String(id), res: String(resolution || 720) })
  if (season && episode) {
    params.set('se', String(season))
    params.set('ep', String(episode))
  }
  if (kind) params.set('kind', kind)
  if (title) params.set('title', title)
  if (retry) params.set('retry', String(retry))
  return API + '?' + params.toString()
}

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

function Card({ movie, onClick, onShare }) {
  if (!movie?.subjectId) return null
  const badge = isLive(movie) ? '🔴 Live' : isAnime(movie) ? '✨ Anime' : isTV(movie) ? '📺 Series' : '🎬 Movie'
  return (
    <article className="mv-card" onClick={() => onClick(movie)}>
      <div className="mv-poster-wrap">
        <img src={cover(movie)} alt={movie.title || 'Movie'} className="mv-poster" loading="lazy" onError={event => { event.currentTarget.src = PLACEHOLDER }} />
        <div className="mv-poster-overlay"><div className="mv-play-icon">▶</div></div>
        {movie.imdbRatingValue && <span className="mv-rating-badge">⭐ {movie.imdbRatingValue}</span>}
        <span className="mv-type-badge">{badge}</span>
        {onShare && <button type="button" className="mv-card-share" onClick={event => { event.stopPropagation(); onShare(movie) }} aria-label={`Share ${movie.title || 'movie'}`}>↗</button>}
      </div>
      <div className="mv-card-info">
        <p className="mv-card-title">{movie.title || 'Untitled'}</p>
        <div className="mv-card-meta">
          {year(movie) && <span className="mv-card-year">{year(movie)}</span>}
          {movie.genre && <span className="mv-card-genre">{String(movie.genre).split(',')[0].trim()}</span>}
        </div>
      </div>
    </article>
  )
}

function Rail({ title, items, onSelect, onShare }) {
  if (!items?.length) return null
  return (
    <section className="mv-rail">
      <div className="mv-section-head">
        <h2 className="mv-section-title"><span className="mv-section-bar" />{title}</h2>
        <span className="mv-count">{items.length} titles</span>
      </div>
      <div className="mv-rail-track">
        {items.map(movie => <Card key={`${title}-${movie.subjectId}`} movie={movie} onClick={onSelect} onShare={onShare} />)}
      </div>
    </section>
  )
}

function DownloadButton({ href, label, size, filename, item, season, episode, mediaKind: kind }) {
  const fallbackName = `${String(label || 'movie').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'movie'}.mp4`
  const [status, setStatus] = useState('idle')
  const isLocalResolver = String(href || '').startsWith('/')

  const startDownload = async event => {
    if (!href) return
    if (!isLocalResolver) {
      item && recordDownload(item, { season, episode, mediaKind: kind, filename: filename || fallbackName, resolution: label })
      return
    }
    event.preventDefault()
    if (status === 'loading') return
    setStatus('loading')
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), DOWNLOAD_CHECK_TIMEOUT)
    try {
      const checkUrl = new URL(href, window.location.origin)
      checkUrl.searchParams.set('action', 'download-check')
      const response = await fetch(checkUrl.pathname + checkUrl.search, { cache: 'no-store', signal: controller.signal })
      const payload = await response.json().catch(() => ({}))
      if (response.ok && payload?.available === true) {
        item && recordDownload(item, { season, episode, mediaKind: kind, filename: filename || fallbackName, resolution: label })
        setStatus('idle')
        window.location.assign(href)
        return
      }
      throw new Error(payload?.error || 'Download source is temporarily unavailable')
    } catch (error) {
      setStatus('error')
      window.setTimeout(() => setStatus('idle'), 4000)
    } finally {
      window.clearTimeout(timeout)
    }
  }

  return (
    <a className={`mv-download-btn${status === 'error' ? ' is-error' : ''}`} href={href || '#'} download={filename || fallbackName} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" aria-busy={status === 'loading'} onClick={startDownload}>
      <span className="mv-download-status" role={status === 'loading' ? 'status' : undefined}>
        {status === 'loading' ? <span className="mv-download-spinner" aria-hidden="true" /> : null}
        {status === 'loading' ? 'Checking source…' : status === 'error' ? '⚠ Retry download' : `⬇ ${label}`}
      </span>
      {size ? <span className="mv-download-size">{size}</span> : null}
    </a>
  )
}

function StableVideo({ src, resetKey = '', captions = [], poster = '', onRetry }) {
  const retryRef = useRef(null)
  const loadTimeoutRef = useRef(null)
  const stallTimeoutRef = useRef(null)
  const hasStartedRef = useRef(false)
  const autoRetryCountRef = useRef(0)
  const onRetryRef = useRef(onRetry)
  const [error, setError] = useState(false)
  const [autoRetryExhausted, setAutoRetryExhausted] = useState(false)

  useEffect(() => {
    onRetryRef.current = onRetry
  }, [onRetry])

  const retry = useCallback((manual = false) => {
    clearTimeout(retryRef.current)
    clearTimeout(stallTimeoutRef.current)
    if (manual) {
      autoRetryCountRef.current = 0
      setAutoRetryExhausted(false)
    }
    if (manual) setError(false)
    onRetryRef.current?.()
  }, [])

  const scheduleAutoRetry = useCallback(() => {
    if (autoRetryCountRef.current >= MAX_AUTO_STREAM_RETRIES) {
      setAutoRetryExhausted(true)
      return
    }
    const attempt = autoRetryCountRef.current
    autoRetryCountRef.current += 1
    clearTimeout(retryRef.current)
    retryRef.current = window.setTimeout(() => retry(false), Math.min(2500 * (2 ** attempt), 10000))
  }, [retry])

  const markUnavailable = useCallback(() => {
    clearTimeout(loadTimeoutRef.current)
    clearTimeout(stallTimeoutRef.current)
    setError(true)
    scheduleAutoRetry()
  }, [scheduleAutoRetry])

  const markAvailable = useCallback(() => {
    clearTimeout(loadTimeoutRef.current)
    clearTimeout(stallTimeoutRef.current)
    clearTimeout(retryRef.current)
    hasStartedRef.current = true
    autoRetryCountRef.current = 0
    setError(false)
    setAutoRetryExhausted(false)
  }, [])

  const handleWaiting = useCallback(event => {
    if (!hasStartedRef.current || event.currentTarget.paused || error) return
    clearTimeout(stallTimeoutRef.current)
    stallTimeoutRef.current = window.setTimeout(markUnavailable, STREAM_STALL_TIMEOUT)
  }, [error, markUnavailable])

  useEffect(() => {
    setError(false)
    setAutoRetryExhausted(false)
    hasStartedRef.current = false
    autoRetryCountRef.current = 0
  }, [resetKey])

  useEffect(() => {
    clearTimeout(retryRef.current)
    clearTimeout(loadTimeoutRef.current)
    clearTimeout(stallTimeoutRef.current)
    loadTimeoutRef.current = window.setTimeout(markUnavailable, STREAM_INITIAL_LOAD_TIMEOUT)
    return () => {
      clearTimeout(retryRef.current)
      clearTimeout(loadTimeoutRef.current)
      clearTimeout(stallTimeoutRef.current)
    }
  }, [src, markUnavailable])

  return (
    <div className="mv-stable-video">
      <video className="mv-video" src={src} poster={poster} controls autoPlay playsInline preload="metadata"
        onLoadedMetadata={markAvailable} onLoadedData={markAvailable} onCanPlay={markAvailable} onPlaying={markAvailable} onWaiting={handleWaiting}
        onError={markUnavailable}>
        {captions.filter(caption => caption?.url).slice(0, 8).map((caption, index) => (
          <track key={`${caption.language}-${index}`} kind="subtitles" src={caption.url} srcLang={String(caption.language || 'en').slice(0, 2).toLowerCase()} label={caption.language || 'Subtitles'} default={index === 0} />
        ))}
      </video>
      {error && <div className="mv-video-retry-actions"><button className="mv-video-retry" type="button" onClick={() => retry(true)}>↻ Retry stream</button><span>{autoRetryExhausted ? 'Source unavailable after automatic retries. Tap Retry to check again.' : 'Rechecking available sources…'}</span></div>}
    </div>
  )
}

function DetailChips({ title, items, className = 'mv-detail-chip' }) {
  const label = item => typeof item === 'string' || typeof item === 'number' ? String(item) : item?.language || item?.name || item?.lan_name || item?.lanName || item?.lan_code || item?.lan || item?.original || item?.title || ''
  const labels = (items || []).map(label).filter(Boolean)
  if (!labels.length) return null
  return (
    <section className="mv-detail-section">
      <h3 className="mv-modal-sub">{title}</h3>
      <div className="mv-detail-chip-list">{labels.map((item, index) => <span className={className} key={`${item}-${index}`}>{item}</span>)}</div>
    </section>
  )
}

function Modal({ movie, onClose, onSelect, onShare }) {
  const [detail, setDetail] = useState(movie)
  const [playData, setPlayData] = useState(null)
  const [recs, setRecs] = useState([])
  const [trailer, setTrailer] = useState(null)
  const [cast, setCast] = useState([])
  const [dubs, setDubs] = useState([])
  const [captions, setCaptions] = useState([])
  const [downloads, setDownloads] = useState([])
  const [loadInfo, setLoadInfo] = useState(true)
  const [error, setError] = useState('')
  const [season, setSeason] = useState(Number(movie.season) || 1)
  const [episode, setEpisode] = useState(Number(movie.episode) || 1)
  const [resolution, setResolution] = useState(720)
  const [playing, setPlaying] = useState(false)
  const [streamRetry, setStreamRetry] = useState(0)
  const [saved, setSaved] = useState(false)
  const historyRef = useRef(false)
  const animeHint = isAnime(movie)
  const liveHint = isLive(movie)
  const tvHint = isTV(movie) || animeHint

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    window.history.pushState({ movieModal: true }, '')
    historyRef.current = true
    const onPopState = () => { historyRef.current = false; onClose() }
    window.addEventListener('popstate', onPopState)
    return () => { document.body.style.overflow = ''; window.removeEventListener('popstate', onPopState) }
  }, [onClose])

  const close = useCallback(() => {
    if (historyRef.current) { historyRef.current = false; window.history.back() } else onClose()
  }, [onClose])

  useEffect(() => {
    let active = true
    const id = movie.subjectId
    setSaved(isInMyList(movie, { season: movie.season, episode: movie.episode }))
    setLoadInfo(true); setError(''); setPlaying(false)
    const requests = [
      request(animeHint ? 'anime-info' : 'detail', { id }),
      request(animeHint ? 'anime-play' : liveHint ? 'live-stream-meta' : 'play', { id, res: 720, se: tvHint && !liveHint ? season : '', ep: tvHint && !liveHint ? episode : '' }),
      liveHint ? Promise.resolve({ data: { items: [] } }) : request('recommend', { id }),
      liveHint ? Promise.resolve({ data: null }) : request('trailer', { id }),
      liveHint ? Promise.resolve({ data: [] }) : request('cast', { id }),
      liveHint ? Promise.resolve({ data: [] }) : request('dubs', { id }),
      liveHint ? Promise.resolve({ data: [] }) : request(animeHint ? 'anime-captions' : 'captions', { id, res: 720, se: tvHint ? season : '', ep: tvHint ? episode : '' }),
      liveHint ? Promise.resolve({ data: { files: [] } }) : request(animeHint ? 'anime-downloads' : 'downloads', { id, res: 720, se: tvHint ? season : '', ep: tvHint ? episode : '', title: movie.title }),
    ]
    Promise.allSettled(requests).then(results => {
      if (!active) return
      const [detailResult, playResult, recResult, trailerResult, castResult, dubsResult, captionResult, downloadResult] = results
      const detailData = detailResult.status === 'fulfilled' ? detailResult.value?.data : null
      if (detailData) {
        setDetail({ ...movie, ...detailData, mediaKind: detailData.mediaKind || movie.mediaKind })
        if (animeHint) {
          const animeDubLabel = item => typeof item === 'string' ? item : item?.language || item?.name || item?.lan_name || item?.lan_code || item?.original || item?.title || ''
          const animeDubs = Array.isArray(detailData.dubs) ? detailData.dubs.map(animeDubLabel).filter(Boolean) : []
          const animeSubtitleLabel = item => typeof item === 'string' ? item : item?.language || item?.name || item?.lan_name || item?.lan_code || item?.title || ''
          setDubs(animeDubs)
          setCaptions((detailData.subtitleLanguages || []).map(animeSubtitleLabel).filter(Boolean).map(language => ({ language, url: '' })))
        }
      }
      if (playResult.status === 'fulfilled') setPlayData(playResult.value?.data || null)
      if (recResult.status === 'fulfilled') setRecs((recResult.value?.data?.items || recResult.value?.data?.subjectList || []).slice(0, 12))
      if (trailerResult.status === 'fulfilled') setTrailer(trailerResult.value?.data || null)
      if (castResult.status === 'fulfilled') setCast(castResult.value?.data || [])
      if (dubsResult.status === 'fulfilled' && !animeHint) setDubs(Array.isArray(dubsResult.value?.data) ? dubsResult.value.data : Object.values(dubsResult.value?.data || {}))
      if (captionResult.status === 'fulfilled' && (captionResult.value?.data || []).some(caption => caption?.url)) setCaptions(captionResult.value.data)
      if (downloadResult.status === 'fulfilled') setDownloads(downloadResult.value?.data?.files || [])
      if (results.slice(0, 2).every(result => result.status === 'rejected')) setError('Media details are temporarily unavailable. You can close this window and try again.')
      setLoadInfo(false)
    })
    return () => { active = false }
  }, [movie.subjectId])

  useEffect(() => {
    if (liveHint) return undefined
    let active = true
    Promise.allSettled([
      request(animeHint ? 'anime-captions' : 'captions', { id: movie.subjectId, res: 720, se: tvHint ? season : '', ep: tvHint ? episode : '' }),
      request(animeHint ? 'anime-downloads' : 'downloads', { id: movie.subjectId, res: 720, se: tvHint ? season : '', ep: tvHint ? episode : '', title: movie.title }),
    ]).then(([captionResult, downloadResult]) => {
      if (!active) return
      if (captionResult.status === 'fulfilled' && (captionResult.value?.data || []).some(caption => caption?.url)) setCaptions(captionResult.value.data)
      if (downloadResult.status === 'fulfilled') setDownloads(downloadResult.value?.data?.files || [])
    })
    return () => { active = false }
  }, [movie.subjectId, season, episode, animeHint, liveHint, tvHint])

  const d = detail || movie
  const tv = isTV(d)
  const anime = isAnime(d) || isAnime(movie)
  const live = isLive(d) || isLive(movie)
  const episodic = tv || anime
  const kind = mediaKind(d) || mediaKind(movie)
  const seasons = playData?.seasons?.length ? playData.seasons : (episodic ? [1] : [])
  const seasonDetails = Array.isArray(playData?.seasonDetails) ? playData.seasonDetails : []
  const episodesForSeason = selectedSeason => {
    const found = seasonDetails.find(item => Number(item?.number) === Number(selectedSeason))
    return found?.episodes?.length ? found.episodes : Array.from({ length: 24 }, (_, index) => index + 1)
  }
  const currentEpisodes = episodesForSeason(season)
  const stream = mediaUrl(movie.subjectId, resolution, episodic ? season : '', episodic ? episode : '', 'stream', '', kind, streamRetry)
  const directDownload = live ? '' : mediaUrl(movie.subjectId, resolution, episodic ? season : '', episodic ? episode : '', 'download', d.title, kind)
  const trailerUrl = trailer?.url || ''

  const watchEpisode = (nextSeason, nextEpisode) => {
    setSeason(nextSeason); setEpisode(nextEpisode); setStreamRetry(0); setPlaying(true)
    recordWatched(movie, { season: nextSeason, episode: nextEpisode, mediaKind: kind })
    setTimeout(() => document.querySelector('.mv-player-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  return (
    <div className="mv-modal-backdrop" onClick={event => { if (event.target === event.currentTarget) close() }}>
      <div className="mv-modal">
        <button className="mv-modal-close" onClick={close} aria-label="Close">✕</button>
        <div className="mv-modal-hero">
          <div className="mv-modal-hero-bg" style={{ backgroundImage: `url(${cover(d)})` }} />
          <div className="mv-modal-hero-grad" />
          <div className="mv-modal-hero-inner">
            <img src={cover(d)} alt={d.title || 'Movie'} className="mv-modal-poster" onError={event => { event.currentTarget.src = PLACEHOLDER }} />
            <div className="mv-modal-info">
              <div className="mv-modal-badges">
                <span className="mv-modal-badge mv-badge-purple">{live ? '🔴 Live' : anime ? '✨ Anime' : tv ? '📺 Series' : '🎬 Movie'}</span>
                {d.countryName && <span className="mv-modal-badge mv-badge-blue">📍 {d.countryName}</span>}
                {d.imdbRatingValue && <span className="mv-modal-badge mv-badge-amber">⭐ {d.imdbRatingValue}</span>}
              </div>
              <h2 className="mv-modal-title">{d.title || 'Untitled'}</h2>
              <div className="mv-modal-meta">
                {year(d) && <span>📅 {year(d)}</span>}
                {duration(d.duration) && <span>⏱ {duration(d.duration)}</span>}
                {String(d.genre || '').split(',').slice(0, 3).filter(Boolean).map(genre => <span key={genre} style={{ color: '#a78bfa' }}>{genre.trim()}</span>)}
              </div>
              {!loadInfo && <div className="mv-modal-hero-actions">
                <button className="mv-hero-play-btn" onClick={() => { setPlaying(true); recordWatched(movie, { season: episodic ? season : '', episode: episodic ? episode : '', mediaKind: kind }) }}>▶ {live ? 'Watch Live' : episodic ? `Watch S${season} E${episode}` : 'Watch Movie'}</button>
                {!live && <button type="button" className={`mv-modal-save-btn${saved ? ' active' : ''}`} onClick={() => { const next = toggleMyList(movie, { season: episodic ? season : '', episode: episodic ? episode : '', mediaKind: kind }); setSaved(next.some(entry => entry.subjectId === String(movie.subjectId) && Number(entry.season || 0) === Number(season || 0) && Number(entry.episode || 0) === Number(episode || 0))) }}>{saved ? '✓ Saved' : '+ My List'}</button>}
                {trailerUrl && <button className="mv-modal-trailer-btn" onClick={() => document.querySelector('.mv-trailer-section')?.scrollIntoView({ behavior: 'smooth' })}>▶ Trailer</button>}
                {onShare && <button className="mv-hero-info-btn" onClick={() => onShare(movie, episodic ? season : null, episodic ? episode : null)}>↗ Share</button>}
              </div>}
            </div>
          </div>
        </div>

        <div className="mv-modal-body">
          {loadInfo && <div className="mv-modal-spinner"><div className="mv-spin" /><p>Loading movie data…</p></div>}
          {!loadInfo && error && <div className="mv-inline-error">{error}</div>}
          {!loadInfo && !error && <>
            {d.description && <p className="mv-modal-desc">{d.description}</p>}

            {trailerUrl && <section className="mv-trailer-section">
              <div className="mv-trailer-head"><h3 className="mv-modal-sub">▶ Official trailer</h3><span className="mv-count">{trailer.definition || 'Preview'}</span></div>
              <video className="mv-trailer-video" src={trailerUrl} poster={trailer.cover || cover(d)} controls playsInline preload="metadata" />
            </section>}

            <section className="mv-player-section">
              <div className="mv-player-head"><span className="mv-player-label"><span className="mv-player-dot" />{live ? 'Live event — Stream Now' : episodic ? `S${season} E${episode} — Stream Now` : 'Full Movie — Stream Now'}</span><span className="mv-live-label">{live ? 'LIVE' : 'LIVE SOURCE'}</span></div>
              <div className="mv-quality-row"><span className="mv-quality-label">Quality</span>{RESOLUTIONS.map(value => <button key={value} className={`mv-quality-btn${resolution === value ? ' active' : ''}`} onClick={() => { setResolution(value); setStreamRetry(0) }}>{value}p</button>)}{!live && <DownloadButton href={directDownload} label={`Download ${resolution}p`} filename={`${positionedTitle(d.title, episodic ? season : '', episodic ? episode : '')}-${resolution}p.mp4`} item={d} season={episodic ? season : ''} episode={episodic ? episode : ''} mediaKind={kind} />}</div>
              {playing ? <StableVideo key={`${movie.subjectId}:${season}:${episode}:${resolution}`} resetKey={`${movie.subjectId}:${season}:${episode}:${resolution}`} src={stream} captions={captions} poster={cover(d)} onRetry={() => setStreamRetry(value => value + 1)} /> : <div className="mv-video-wrap mv-video-placeholder" onClick={() => setPlaying(true)}><img src={cover(d)} alt="" /><div className="mv-placeholder-content"><span className="mv-play-large">▶</span><span>{live ? 'Click to watch live' : episodic ? `Select an episode or play S${season} E${episode}` : 'Click to stream'}</span></div></div>}
              <p className="mv-stream-caption">⚡ Toosii API · {resolution}p range-aware MP4{live ? ' · live relay' : episodic ? ` · S${season} E${episode}` : ''}</p>
            </section>

            {episodic && seasons.length > 0 && <section className="mv-eps-panel">
              <div className="mv-eps-head"><div className="mv-eps-title"><span className="mv-player-dot" />Seasons <div className="mv-eps-seasons">{seasons.map(value => <button key={value} className={`mv-eps-season-btn${Number(season) === Number(value) ? ' active' : ''}`} onClick={() => { setSeason(value); setEpisode(1) }}>S{value}</button>)}</div></div><div className="mv-eps-nav"><span className="mv-eps-now">S{season} · E{episode}</span><button className="mv-eps-nav-btn" disabled={episode <= 1} onClick={() => watchEpisode(season, Math.max(1, episode - 1))}>← Prev</button><button className="mv-eps-nav-btn mv-eps-next" disabled={episode >= currentEpisodes.length} onClick={() => watchEpisode(season, Math.min(currentEpisodes.length, episode + 1))}>Next →</button></div></div>
              <div className="mv-eps-strip">{currentEpisodes.map(value => <button key={value} className={`mv-eps-ep${Number(episode) === Number(value) && playing ? ' active' : ''}`} onClick={() => watchEpisode(season, value)}><span className="mv-eps-ep-num">E{value}</span><span className="mv-eps-ep-label">Episode {value}</span></button>)}</div>
            </section>}

            {!live && downloads.length > 0 && <section className="mv-download-section"><div className="mv-download-head">⬇ Available downloads <span className="mv-count">{downloads.length} files</span></div><div className="mv-download-grid">{downloads.map(file => <DownloadButton key={`${file.resourceId}-${file.resolution}`} href={file.downloadUrl} label={`${file.resolution || resolution}p`} filename={file.filename} size={file.size ? `${Math.round(Number(file.size) / 1048576)} MB` : ''} item={d} season={episodic ? season : ''} episode={episodic ? episode : ''} mediaKind={kind} />)}</div></section>}

            <div className="mv-detail-grid">
              <DetailChips title="Available dubs" items={dubs} className="mv-dub-chip" />
              <DetailChips title="Subtitles" items={captions.map(caption => caption.language)} className="mv-sub-chip" />
            </div>
            {cast.length > 0 && <section className="mv-detail-section"><h3 className="mv-modal-sub">Cast & crew</h3><div className="mv-cast-list">{cast.slice(0, 18).map((person, index) => <span className="mv-cast-chip" key={`${person.name}-${index}`}><strong>{person.name}</strong>{person.character ? ` · ${person.character}` : ''}</span>)}</div></section>}

            {recs.length > 0 && <section className="mv-recommend-section"><h3 className="mv-modal-sub">You May Also Like</h3><div className="mv-recommend-grid">{recs.map(item => <Card key={item.subjectId} movie={item} onClick={next => { onClose(); setTimeout(() => onSelect(next), 50) }} onShare={onShare} />)}</div></section>}
          </>}
        </div>
      </div>
    </div>
  )
}

export default function MoviesPage({ shared = null }) {
  const [trending, setTrending] = useState([])
  const [hero, setHero] = useState(null)
  const [results, setResults] = useState([])
  const [rails, setRails] = useState({ home: [], moviePopular: [], movieNew: [], movieTop: [], tvPopular: [], tvTrending: [], tvNew: [], animeTrending: [], animeBrowse: [], live: [] })
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [type, setType] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [catalogMode, setCatalogMode] = useState('moviePopular')
  const [selected, setSelected] = useState(null)
  const sharedLoaded = useRef(false)

  const loadRail = useCallback(async (mode, params = {}) => {
    try {
      const payload = await request(mode === 'home' ? 'home' : mode, params)
      const items = payload?.data?.items || payload?.data?.subjectList || []
      const railKey = { 'movie-popular': 'moviePopular', 'movie-new': 'movieNew', 'movie-top': 'movieTop', 'tv-popular': 'tvPopular', 'tv-trending': 'tvTrending', 'tv-new': 'tvNew', 'anime-trending': 'animeTrending', 'anime-browse': 'animeBrowse', live: 'live' }[mode] || mode
      setRails(previous => ({ ...previous, [railKey]: items }))
      return items
    } catch { return [] }
  }, [])

  useEffect(() => {
    let active = true
    Promise.allSettled([request('trending'), request('home'), request('movie-popular'), request('movie-new'), request('tv-trending'), request('anime-home'), request('live')]).then(values => {
      if (!active) return
      const [trend, home, moviePopular, movieNew, tvTrending, animeHome, live] = values
      const getItems = result => result.status === 'fulfilled' ? (result.value?.data?.items || result.value?.data?.subjectList || []) : []
      const trendItems = getItems(trend)
      const homeSections = home.status === 'fulfilled' ? (home.value?.data?.sections || []) : []
      const animeSections = animeHome.status === 'fulfilled' ? (animeHome.value?.data?.sections || []) : []
      setTrending(trendItems)
      setHero(trendItems[Math.floor(Math.random() * Math.min(5, trendItems.length))] || trendItems[0] || null)
      setRails({ home: homeSections.flatMap(section => section.items || []).slice(0, 20), moviePopular: getItems(moviePopular), movieNew: getItems(movieNew), movieTop: [], tvPopular: [], tvTrending: getItems(tvTrending), tvNew: [], animeTrending: animeSections.flatMap(section => section.items || []).slice(0, 20), animeBrowse: [], live: getItems(live) })
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const requestedCatalog = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('catalog') : ''
    if (requestedCatalog && ['moviePopular', 'movieNew', 'movieTop', 'tvPopular', 'tvTrending', 'tvNew', 'animeTrending', 'animeBrowse', 'live'].includes(requestedCatalog)) setCatalogMode(requestedCatalog)
  }, [])

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return undefined }
    const timer = setTimeout(() => request('suggest', { q: query, limit: 6 }).then(payload => setSuggestions(payload?.data || [])).catch(() => setSuggestions([])), 250)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!shared || sharedLoaded.current) return
    sharedLoaded.current = true
    if (shared.query) {
      setQuery(shared.query); setSearching(true)
      request('search', { q: shared.query, type: shared.type }).then(payload => setResults(payload?.data?.items || payload?.data?.subjectList || [])).catch(() => {}).finally(() => setSearching(false))
    }
    if (shared.id) setSelected({ subjectId: shared.id, title: shared.title || 'Shared title', cover: shared.cover ? { url: shared.cover } : '', subjectType: Number(shared.type) || 1, mediaKind: shared.kind || '', season: Number(shared.season) || 1, episode: Number(shared.episode) || 1 })
  }, [shared])

  const handleSearch = async event => {
    event?.preventDefault()
    if (!query.trim()) { setResults([]); return }
    setSearching(true)
    try { const payload = await request('search', { q: query, type }); setResults(payload?.data?.items || payload?.data?.subjectList || []) } catch { setResults([]) }
    setSearching(false); setSuggestions([])
  }

  const shareMovie = async (movie = selected, season = movie?.season, episode = movie?.episode) => {
    if (!movie?.subjectId) return
    const link = new URL('/tools/movies/watch', window.location.origin)
    link.searchParams.set('id', movie.subjectId); link.searchParams.set('title', movie.title || 'Shared movie')
    if (cover(movie) !== PLACEHOLDER) link.searchParams.set('cover', cover(movie))
    if (movie.subjectType) link.searchParams.set('type', movie.subjectType)
    if (mediaKind(movie)) link.searchParams.set('kind', mediaKind(movie))
    const episodic = isTV(movie) || isAnime(movie)
    if (season && episodic) link.searchParams.set('season', season)
    if (episode && episodic) link.searchParams.set('episode', episode)
    const shareTitle = episodic ? positionedTitle(movie.title || 'Movie', season, episode) : (movie.title || 'Movie')
    link.searchParams.set('title', shareTitle)
    await shareOrCopy({ title: `${shareTitle} — Toosii Tech`, text: `Watch ${shareTitle} on Toosii Tech`, url: link.toString() })
  }

  const shareMovieSearch = async () => {
    if (!query.trim()) return
    const link = new URL('/tools/movies/watch', window.location.origin)
    link.searchParams.set('q', query.trim()); if (type) link.searchParams.set('type', type)
    await shareOrCopy({ title: `Search movies for ${query.trim()} — Toosii Tech`, text: `Browse movie results for ${query.trim()}`, url: link.toString() })
  }

  const display = results.length ? results : trending
  const railItems = rails[catalogMode] || []
  const railTitle = { moviePopular: 'Popular movies', movieNew: 'New movies', movieTop: 'Top-rated movies', tvPopular: 'Popular series', tvTrending: 'Trending series', tvNew: 'New series', animeTrending: 'Trending anime', animeBrowse: 'Browse anime', live: 'Live events & replays' }[catalogMode] || 'Browse catalog'
  const railActions = { moviePopular: 'movie-popular', movieNew: 'movie-new', movieTop: 'movie-top', tvPopular: 'tv-popular', tvTrending: 'tv-trending', tvNew: 'tv-new', animeTrending: 'anime-trending', animeBrowse: 'anime-browse', live: 'live' }

  return (
    <div className="mv-page">
      {hero && <div className="mv-hero" onClick={() => setSelected(hero)}>
        <div className="mv-hero-bg" style={{ backgroundImage: `url(${cover(hero)})` }} /><div className="mv-hero-gradient" />
        <div className="mv-hero-content"><div className="mv-hero-badge">🔥 Trending Now</div><h1 className="mv-hero-title">{hero.title}</h1><div className="mv-hero-meta">{year(hero) && <span>📅 {year(hero)}</span>}{hero.imdbRatingValue && <span>⭐ {hero.imdbRatingValue}</span>}{hero.genre && <span>🎭 {String(hero.genre).split(',')[0]}</span>}<span>{isLive(hero) ? '🔴 Live' : isAnime(hero) ? '✨ Anime' : isTV(hero) ? '📺 Series' : '🎬 Movie'}</span></div><div className="mv-hero-btns"><button className="mv-hero-play-btn" onClick={event => { event.stopPropagation(); setSelected(hero) }}>▶ Play Now</button><button className="mv-hero-info-btn" onClick={event => { event.stopPropagation(); setSelected(hero) }}>ℹ More Info</button></div></div>
      </div>}

      <div className="mv-utility-nav"><a href="/search">⌕ Global Search</a><a href="/library">✦ My Library</a><a href="/tools/movies?catalog=animeTrending">✨ Anime</a><a href="/tools/movies?catalog=live">🔴 Live TV</a></div>
      <div className="mv-search-wrap"><form className="mv-search-row" onSubmit={handleSearch}><span className="mv-search-icon">🔍</span><input className="mv-search-input" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search movies, series, anime, live…" aria-label="Search movies, series, anime, and live events" /><select className="mv-search-type" value={type} onChange={event => setType(event.target.value)} aria-label="Content type"><option value="">All</option><option value="1">Movies</option><option value="2">Series</option><option value="anime">Anime</option><option value="live">Live</option></select><button type="submit" className="mv-search-btn">Search</button></form>{suggestions.length > 0 && <div className="mv-suggestions">{suggestions.map((suggestion, index) => <button key={`${suggestion.subjectId || suggestion.title || index}`} type="button" onClick={() => { setQuery(suggestion.title || suggestion.name || ''); setSuggestions([]) }}>{suggestion.title || suggestion.name || 'Suggestion'}</button>)}</div>}</div>

      {results.length > 0 ? <section className="mv-section"><div className="mv-section-head"><h2 className="mv-section-title"><span className="mv-section-bar" />Results for “{query}”</h2><div className="mv-section-actions"><button className="mv-share-search-btn" onClick={shareMovieSearch}>↗ Share Search</button><button className="mv-clear-btn" onClick={() => { setResults([]); setQuery('') }}>✕ Clear</button><span className="mv-count">{results.length} titles</span></div></div><div className="mv-grid">{results.map(movie => <Card key={movie.subjectId} movie={movie} onClick={setSelected} onShare={shareMovie} />)}</div></section> : <>
        {loading ? <section className="mv-section"><div className="mv-grid">{Array.from({ length: 12 }).map((_, index) => <Skeleton key={index} />)}</div></section> : <Rail title="🔥 Trending" items={trending} onSelect={setSelected} onShare={shareMovie} />}
        <section className="mv-catalog-controls"><div><span className="mv-catalog-eyebrow">DAVE CATALOG</span><h2>Browse every rail</h2><p>Switch between movie and series catalogs, rankings, new releases, and genre shelves.</p></div><div className="mv-catalog-tabs">{[['moviePopular', 'Movie Popular'], ['movieNew', 'Movie New'], ['movieTop', 'Movie Top'], ['tvPopular', 'TV Popular'], ['tvTrending', 'TV Trending'], ['tvNew', 'TV New'], ['animeTrending', 'Anime Trending'], ['animeBrowse', 'Anime Browse'], ['live', 'Live Events']].map(([id, label]) => <button key={id} className={catalogMode === id ? 'active' : ''} onClick={() => { setCatalogMode(id); if (!rails[id]?.length) loadRail(railActions[id]) }}>{label}</button>)}</div></section>
        <Rail title={railTitle} items={railItems} onSelect={setSelected} onShare={shareMovie} />
        {rails.home.length > 0 && <Rail title="Curated for you" items={rails.home} onSelect={setSelected} onShare={shareMovie} />}
      </>}

      <section className="mv-discover-bar"><div><span className="mv-catalog-eyebrow">DISCOVER</span><h2>Find by genre</h2></div><div className="mv-discover-actions">{['Action', 'Drama', 'Comedy', 'Romance', 'Sci-Fi'].map(genre => <button key={genre} onClick={() => loadRail('discover', { contentType: 'MOVIE', genre })}>{genre}</button>)}</div></section>

      {selected && <Modal movie={selected} onClose={() => setSelected(null)} onSelect={setSelected} onShare={shareMovie} />}
    </div>
  )
}
