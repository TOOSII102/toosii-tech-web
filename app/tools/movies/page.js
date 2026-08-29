'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { shareOrCopy } from '../../../lib/clientShare'
import { isInMyList, recordDownload, recordWatched, toggleMyList } from '../../../lib/clientMediaState'
import { supportsBackgroundFetch, createStreamDownload, createBackgroundDownload, claimBackgroundDownload, claimAllPendingBackgroundDownloads, saveBlobToDevice, isRestrictiveWebView } from '../../../lib/downloadManager'
import '../tools.css'
import './movies.css'

const DAVE_BASE = 'https://davexmovieapi.zone.id'
const RESOLUTIONS = [1080, 720, 480, 360]
const PLACEHOLDER = 'https://placehold.co/300x450/0d0d1a/8b5cf6?text=Toosii'
const CLIENT_CACHE_TTL = 60 * 1000
const CLIENT_CACHE_MAX = 150
const MAX_AUTO_STREAM_RETRIES = 3
const DAVE_REQUEST_TIMEOUT = 15000
const STREAM_STALL_TIMEOUT = 8000
const STREAM_INITIAL_LOAD_TIMEOUT = 20000
const DOWNLOAD_CHECK_TIMEOUT = 10000
const clientMetadataCache = new Map()

const putClientMetadata = (url, payload) => {
  if (!clientMetadataCache.has(url) && clientMetadataCache.size >= CLIENT_CACHE_MAX) {
    const oldestKey = clientMetadataCache.keys().next().value
    if (oldestKey) clientMetadataCache.delete(oldestKey)
  }
  clientMetadataCache.set(url, { payload, expiresAt: Date.now() + CLIENT_CACHE_TTL })
}
const CACHEABLE_ACTIONS = new Set(['trending', 'hot', 'home', 'movie-popular', 'movie-new', 'movie-top', 'tv-popular', 'tv-trending', 'tv-new', 'anime-home', 'anime-trending', 'anime-browse', 'live', 'search', 'suggest', 'detail', 'movie-info', 'tv-info', 'play', 'seasons', 'tv-seasons', 'recommend', 'movie-recommend', 'tv-recommend', 'trailer', 'cast', 'dubs', 'captions'])

const firstValue = (...values) => values.find(value => value !== undefined && value !== null && value !== '')
const numberValue = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
const formatBytes = bytes => {
  const value = Number(bytes)
  if (!Number.isFinite(value) || value <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  return `${(value / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}
const formatEta = seconds => {
  if (seconds === null || seconds === undefined || !Number.isFinite(Number(seconds)) || Number(seconds) < 0) return 'Calculating…'
  const value = Number(seconds)
  if (value < 60) return `${Math.max(1, Math.ceil(value))}s left`
  const minutes = Math.floor(value / 60)
  const remaining = Math.ceil(value % 60)
  return `${minutes}m ${String(remaining).padStart(2, '0')}s left`
}
const responseTotal = response => {
  const length = Number(response.headers.get('content-length'))
  if (Number.isFinite(length) && length > 0) return length
  const match = String(response.headers.get('content-range') || '').match(/\/(\d+)$/)
  return match ? Number(match[1]) : 0
}
const IDLE_DOWNLOAD_PROGRESS = { phase: 'idle', loaded: 0, total: 0, percent: 0, speed: 0, eta: null }
const DaveType = value => ({ movie: 'MOVIE', tv: 'TV_SERIES', series: 'TV_SERIES', anime: 'ANIME', live: 'ALL' }[String(value || '').toLowerCase()] || 'ALL')
const unwrapDave = payload => payload?.data || payload?.result || payload || {}

function davePath(action, params = {}) {
  const id = encodeURIComponent(String(params.id || ''))
  const q = new URLSearchParams()
  const resolution = params.res || 720
  if (params.se) q.set('season', String(params.se))
  if (params.ep) q.set('episode', String(params.ep))
  if (action === 'home') return '/homepage?tab=0&page=1&mode=clean'
  if (action === 'trending') return '/trending?tab=0&page=1'
  if (action === 'movie-popular') return '/movie/popular?page=1'
  if (action === 'movie-new') return '/movie/new?page=1&per_page=20'
  if (action === 'movie-top') return '/movie/top?page=1&per_page=20'
  if (action === 'tv-popular') return '/tv/popular?page=1'
  if (action === 'tv-trending') return '/tv/trending?page=1&per_page=20'
  if (action === 'tv-new') return '/tv/new?page=1&per_page=20'
  if (action === 'anime-home') return '/anime/home'
  if (action === 'anime-trending') return '/anime/trending?sort=hot&page=1&per_page=20'
  if (action === 'anime-browse') return '/anime/browse?sort=forYou&genre=Animation&page=1&per_page=20'
  if (action === 'live') return '/live?page=1'
  if (action === 'live-search') return `/live/search?q=${encodeURIComponent(params.q || '')}&page=1&per_page=20`
  if (action === 'search') return `/search?q=${encodeURIComponent(params.q || '')}&type=${DaveType(params.type)}&page=1&per_page=20`
  if (action === 'suggest') return `/suggest?q=${encodeURIComponent(params.q || '')}&limit=10`
  if (action === 'anime-info') return `/anime/info/${id}`
  if (action === 'movie-info') return `/movie/info/${id}`
  if (action === 'tv-info') return `/tv/info/${id}`
  if (action === 'detail') return `/item/${id}`
  if (action === 'anime-seasons') return `/anime/seasons/${id}`
  if (action === 'seasons') return `/item/${id}/seasons`
  if (action === 'tv-seasons') return `/tv/seasons/${id}`
  if (action === 'movie-recommend') return `/movie/recommend/${id}?limit=12`
  if (action === 'tv-recommend') return `/tv/recommend/${id}?limit=12`
  if (action === 'trailer') return `/item/${id}/trailer`
  if (action === 'cast') return `/item/${id}/cast`
  if (action === 'dubs') return `/item/${id}/dubs`
  if (action === 'captions') return `/item/${id}/captions/auto?resolution=${encodeURIComponent(resolution)}`
  if (action === 'anime-captions') return `/anime/captions/${id}?resolution=${encodeURIComponent(resolution)}${q.toString() ? `&${q}` : ''}`
  if (action === 'downloads') return `/item/${id}/downloads?resolution=${encodeURIComponent(resolution)}${q.toString() ? `&${q}` : ''}`
  if (action === 'anime-downloads') return params.se && params.ep
    ? `/anime/episode/download/${id}?season=${encodeURIComponent(params.se)}&episode=${encodeURIComponent(params.ep)}&resolution=${encodeURIComponent(resolution)}`
    : `/anime/download/${id}?resolution=${encodeURIComponent(resolution)}`
  if (action === 'live-stream-meta') return `/live/stream/${id}?resolution=${encodeURIComponent(resolution)}`
  if (action === 'anime-play') return `/anime/stream/${id}?resolution=${encodeURIComponent(resolution)}${q.toString() ? `&${q}` : ''}`
  return `/movie/stream/${id}?resolution=${encodeURIComponent(resolution)}`
}

function normalizeDaveMovie(item, forcedKind = '') {
  const value = item || {}
  const coverValue = firstValue(value.cover?.url, value.cover, value.poster_url, value.posterUrl, value.image)
  return {
    ...value,
    subjectId: String(firstValue(value.subject_id, value.subjectId, value.id, '')),
    subjectType: numberValue(firstValue(value.subject_type, value.subjectType), 1),
    title: firstValue(value.title, value.name, 'Untitled'),
    description: firstValue(value.description, value.synopsis, ''),
    releaseDate: firstValue(value.release_date, value.releaseDate, value.year, ''),
    genre: Array.isArray(value.genre) ? value.genre.join(', ') : firstValue(value.genre, ''),
    cover: coverValue ? (value.cover?.url ? value.cover : coverValue) : '',
    imdbRatingValue: firstValue(value.imdb_rating_value, value.imdb_rating, value.rating, ''),
    duration: firstValue(value.duration_seconds, value.duration, ''),
    countryName: firstValue(value.country_name, value.country, ''),
    mediaKind: forcedKind || value.mediaKind || (numberValue(firstValue(value.subject_type, value.subjectType), 1) === 9 ? 'live' : ''),
  }
}

function collectionItems(payload, forcedKind = '') {
  const root = unwrapDave(payload)
  const sections = Array.isArray(root.sections) ? root.sections : []
  const list = Array.isArray(root.results) ? root.results : Array.isArray(root.items) ? root.items : Array.isArray(root.subjectList) ? root.subjectList : []
  const sectionItems = sections.flatMap(section => Array.isArray(section?.items) ? section.items : [])
  return (list.length ? list : sectionItems).map(item => normalizeDaveMovie(item, forcedKind)).filter(item => item.subjectId && item.title)
}

function normalizeDaveSeasons(payload) {
  const seasons = Array.isArray(unwrapDave(payload)?.seasons) ? unwrapDave(payload).seasons : []
  return seasons.map(item => {
    const number = numberValue(firstValue(item.season_number, item.number), 1)
    const maxEpisodes = numberValue(firstValue(item.max_episodes, item.episode_count), 0)
    const episodeCount = maxEpisodes || Math.max(...(Array.isArray(item.resolutions) ? item.resolutions.map(resolution => numberValue(resolution.ep_num)).filter(Boolean) : []), 1)
    return { number, episodes: Array.from({ length: Math.min(episodeCount, 100) }, (_, index) => index + 1) }
  })
}

function normalizeDaveCaptions(payload) {
  const root = unwrapDave(payload)
  const source = Array.isArray(root.captions) ? root.captions : Array.isArray(root.subtitles) ? root.subtitles : []
  return source.map(item => ({ language: firstValue(item.lanName, item.language, item.lang, 'Unknown'), url: firstValue(item.proxyUrl, item.proxy_url, item.downloadUrl, item.url), format: firstValue(item.format, 'vtt') })).filter(item => item.url)
}

function normalizeDaveDownloads(payload, params) {
  const root = unwrapDave(payload)
  const byQuality = root.by_quality || root.byQuality || {}
  const files = Object.values(byQuality).length ? Object.values(byQuality) : (Array.isArray(root.files) ? root.files : Array.isArray(root.downloads) ? root.downloads : Array.isArray(root.list) ? root.list : [])
  return files.map((item, index) => {
    const resolution = numberValue(firstValue(item.resolution, item.height, String(item.quality || '').replace(/[^0-9]/g, '')), 0)
    const filename = firstValue(item.filename, item.file_name, item.title, daveFilename(params.title, resolution || params.res || 720, params.se, params.ep))
    return {
      resourceId: String(firstValue(item.resource_id, item.resourceId, index)),
      resolution,
      filename,
      size: firstValue(item.file_size, item.fileSize, item.size, 0),
      codec: firstValue(item.codec, item.codecName, ''),
      duration: firstValue(item.duration, 0),
      browserCompatible: true,
      downloadUrl: mediaUrl(params.id, resolution || params.res || 720, params.se || '', params.ep || '', 'download', params.title || filename),
    }
  }).filter(item => item.resolution || item.filename)
}

function normalizeDaveTrailer(payload) {
  const root = unwrapDave(payload)
  const item = root.trailer || root.video_address || root.videoAddress || root
  return { url: firstValue(item.url, item.video_url, item.videoUrl, ''), cover: firstValue(item.cover?.url, root.cover?.url, ''), duration: firstValue(item.duration, 0), definition: firstValue(item.definition, item.quality, '') }
}

function normalizeDaveStaff(payload) {
  const root = unwrapDave(payload)
  const list = Array.isArray(root.staff_list) ? root.staff_list : Array.isArray(root.cast) ? root.cast : Array.isArray(root.results) ? root.results : []
  return list.map(item => ({ name: firstValue(item.name, item.actor, item.character, ''), character: firstValue(item.character, item.role, ''), avatar: firstValue(item.avatar_url, item.avatar, '') })).filter(item => item.name)
}

function normalizeDavePayload(action, raw, params) {
  if (action === 'home' || action === 'trending' || action === 'anime-home') {
    const root = unwrapDave(raw)
    const sections = Array.isArray(root.sections) ? root.sections.map(section => ({ title: firstValue(section.section_title, section.title, 'Browse'), items: collectionItems({ items: section.items }, action === 'anime-home' ? 'anime' : '') })).filter(section => section.items.length) : []
    return { data: { sections, items: sections.flatMap(section => section.items), subjectList: sections.flatMap(section => section.items) } }
  }
  if (['movie-popular', 'movie-new', 'movie-top', 'tv-popular', 'tv-new', 'tv-trending', 'anime-trending', 'anime-browse', 'live', 'search'].includes(action)) {
    return { data: { items: collectionItems(raw, action.startsWith('anime-') ? 'anime' : action === 'live' ? 'live' : ''), subjectList: collectionItems(raw, action.startsWith('anime-') ? 'anime' : action === 'live' ? 'live' : '') } }
  }
  if (action === 'suggest') return { data: collectionItems({ results: unwrapDave(raw).suggestions || unwrapDave(raw).items || [] }) }
  if (['detail', 'movie-info', 'tv-info', 'anime-info'].includes(action)) return { data: normalizeDaveMovie(unwrapDave(raw), action === 'anime-info' ? 'anime' : '') }
  if (['seasons', 'tv-seasons', 'anime-seasons'].includes(action)) {
    const seasonDetails = normalizeDaveSeasons(raw)
    return { data: { seasons: seasonDetails.map(item => item.number), seasonDetails } }
  }
  if (action === 'play') return { data: { seasons: [] } }
  if (action === 'anime-play' || action === 'live-stream-meta') return { data: { ...unwrapDave(raw), url: firstValue(unwrapDave(raw).playback_url, unwrapDave(raw).playbackUrl, unwrapDave(raw).url, ''), available: true } }
  if (['movie-recommend', 'tv-recommend'].includes(action)) return { data: { items: collectionItems(raw), subjectList: collectionItems(raw) } }
  if (action === 'trailer') return { data: normalizeDaveTrailer(raw) }
  if (action === 'cast') return { data: normalizeDaveStaff(raw) }
  if (action === 'dubs') return { data: unwrapDave(raw).dubs || unwrapDave(raw).languages || [] }
  if (action === 'captions' || action === 'anime-captions') return { data: normalizeDaveCaptions(raw) }
  if (action === 'downloads' || action === 'anime-downloads') return { data: { files: normalizeDaveDownloads(raw, params) } }
  return { data: unwrapDave(raw) }
}

const request = async (action, params = {}) => {
  const path = davePath(action, params)
  const url = DAVE_BASE + path
  const cacheable = CACHEABLE_ACTIONS.has(action)
  const cached = cacheable ? clientMetadataCache.get(url) : null
  if (cached && cached.expiresAt > Date.now()) return cached.payload
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), DAVE_REQUEST_TIMEOUT)
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal })
    const raw = await response.json().catch(() => ({}))
    if (!response.ok || raw?.status === false || raw?.ok === false) {
      const error = new Error(raw?.error || `Dave service unavailable (${response.status})`)
      error.status = response.status
      error.retryable = response.status >= 500 || response.status === 429
      throw error
    }
    const payload = normalizeDavePayload(action, raw, params)
    if (cacheable) putClientMetadata(url, payload)
    return payload
  } catch (error) {
    if (cached) return cached.payload
    throw error
  } finally {
    window.clearTimeout(timeout)
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

function daveFilename(title, resolution, season, episode) {
  const clean = String(title || 'movie').replace(/[^a-z0-9._ -]/gi, '').trim() || 'movie'
  const position = season && episode ? `-S${season}E${episode}` : ''
  return `${clean}${position}-${resolution || 720}p.mp4`
}

function mediaUrl(id, resolution, season, episode, action = 'stream', title = '') {
  const quality = String(resolution || 720)
  if (action === 'download') {
    const params = new URLSearchParams({ subjectId: String(id), resolution: quality, filename: daveFilename(title, quality, season, episode) })
    if (season && episode) {
      params.set('season', String(season))
      params.set('episode', String(episode))
    }
    return DAVE_BASE + '/proxy/download?' + params.toString()
  }
  const params = new URLSearchParams({ resolution: quality })
  if (season && episode) {
    params.set('season', String(season))
    params.set('episode', String(episode))
  }
  return DAVE_BASE + '/bff/stream/' + encodeURIComponent(String(id)) + '?' + params.toString()
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
  const [status, setStatus] = useState('idle') // idle | loading | paused | ready | error
  const [progress, setProgress] = useState(IDLE_DOWNLOAD_PROGRESS)
  const [mode, setMode] = useState(null) // 'stream' | 'background'
  const [background, setBackground] = useState(false)
  const [saving, setSaving] = useState(false)
  const isLocalResolver = String(href || '').startsWith('/')
  const handoffRef = useRef(null)
  const sessionRef = useRef(null)
  const startedAtRef = useRef(0)
  const bgSupported = supportsBackgroundFetch()

  useEffect(() => () => {
    if (mode === 'stream') sessionRef.current?.pause?.()
    handoffRef.current?.remove()
    handoffRef.current = null
  }, [mode])

  const startNativeHandoff = () => {
    setStatus('loading')
    setMode(null)
    setProgress({ phase: 'handoff', loaded: 0, total: 0, percent: 0, speed: 0, eta: null })
    handoffRef.current?.remove()
    const frame = document.createElement('iframe')
    frame.setAttribute('aria-hidden', 'true')
    frame.tabIndex = -1
    frame.style.position = 'fixed'
    frame.style.width = '1px'
    frame.style.height = '1px'
    frame.style.left = '-9999px'
    frame.style.opacity = '0'
    frame.style.pointerEvents = 'none'
    frame.src = href
    handoffRef.current = frame
    document.body.appendChild(frame)
    window.setTimeout(() => {
      frame.remove()
      if (handoffRef.current === frame) handoffRef.current = null
      setStatus('idle')
      setProgress(current => current.phase === 'handoff' ? IDLE_DOWNLOAD_PROGRESS : current)
    }, 5000)
  }

  const runBackgroundDownload = async () => {
    setMode('background')
    setStatus('loading')
    setProgress({ phase: 'downloading', loaded: 0, total: 0, percent: 0, speed: 0, eta: null })
    let fellBack = false
    try {
      const session = await createBackgroundDownload({
        url: href,
        filename: filename || fallbackName,
        title: filename || label,
        onProgress: ({ loaded, total }) => {
          setProgress({ phase: 'downloading', loaded, total, percent: total ? Math.min(100, Math.round((loaded / total) * 100)) : null, speed: 0, eta: null })
        },
        onStateChange: (next, meta) => {
          if (next === 'ready') { setStatus('ready'); setProgress(current => ({ ...current, phase: 'ready', percent: 100 })) }
          if (next === 'canceled') { setStatus('idle'); setProgress(IDLE_DOWNLOAD_PROGRESS) }
          if (next === 'error' && !fellBack) {
            // The background registration stalled or the finished file couldn't be
            // pulled from cache — silently fall back to the reliable direct engine
            // instead of leaving the user stuck at "Connecting…".
            fellBack = true
            setBackground(false)
            runStreamDownload()
          }
        },
      })
      sessionRef.current = session
    } catch {
      // background fetch unavailable/denied — fall back to the manual streaming engine
      setBackground(false)
      runStreamDownload()
    }
  }

  const saveReadyDownload = async () => {
    if (!sessionRef.current) return
    setSaving(true)
    try {
      let result
      if (mode === 'background' && sessionRef.current.saveNow) {
        result = await sessionRef.current.saveNow()
      } else if (sessionRef.current.getBlob) {
        result = await saveBlobToDevice(sessionRef.current.getBlob(), filename || fallbackName)
      }
      if (result?.canceled) { setStatus('ready'); return }
      setStatus('idle')
      setProgress(current => ({ ...current, phase: 'complete', savedVia: result?.method }))
    } finally {
      setSaving(false)
    }
  }

  const runStreamDownload = () => {
    setMode('stream')
    startedAtRef.current = performance.now()
    let lastReported = 0
    const session = createStreamDownload({
      url: href,
      headers: { Accept: 'video/mp4, video/*, application/octet-stream' },
      onProgress: ({ loaded, total, speed }) => {
        const remaining = total > loaded && speed > 0 ? (total - loaded) / speed : null
        setProgress({ phase: 'downloading', loaded, total, percent: total ? Math.min(100, Math.round((loaded / total) * 100)) : null, speed, eta: remaining })
        lastReported = loaded
      },
      onStateChange: next => {
        if (next === 'connecting') { setStatus('loading'); setProgress({ phase: 'preparing', loaded: 0, total: 0, percent: 0, speed: 0, eta: null }) }
        if (next === 'downloading') setStatus('loading')
        if (next === 'paused') setStatus('paused')
        if (next === 'error') { setStatus('error'); setProgress({ phase: 'error', loaded: lastReported, total: 0, percent: 0, speed: 0, eta: null }); window.setTimeout(() => setStatus('idle'), 4000) }
      },
    })
    sessionRef.current = session
    session.start().then(() => {
      if (session.state !== 'complete') return
      if (!session.loaded) throw new Error('The download returned an empty file')
      // Don't auto-save here — this runs from an async fetch-completion callback with
      // no live user gesture behind it, and browsers can silently drop a programmatic
      // save in that situation (that was the exact "says saved, isn't on disk" bug).
      // Land in 'ready' and require a real tap on "Save to device" instead.
      setStatus('ready')
      setProgress({ phase: 'ready', loaded: session.loaded, total: session.total || session.loaded, percent: 100, speed: 0, eta: 0 })
    }).catch(error => {
      if (session.state === 'canceled' || session.state === 'paused') return
      const canFallbackToNative = error instanceof TypeError || error?.name === 'TypeError'
      if (canFallbackToNative) { startNativeHandoff(); return }
      setStatus('error')
      setProgress({ phase: 'error', loaded: 0, total: 0, percent: 0, speed: 0, eta: null })
      window.setTimeout(() => setStatus('idle'), 4000)
    })
  }

  const startDownload = async event => {
    if (!href) return
    if (!isLocalResolver) {
      event.preventDefault()
      if (status === 'loading' || status === 'paused') return
      item && recordDownload(item, { season, episode, mediaKind: kind, filename: filename || fallbackName, resolution: label })
      sessionRef.current = null
      setStatus('loading')
      setProgress({ phase: 'preparing', loaded: 0, total: 0, percent: 0, speed: 0, eta: null })
      if (background && bgSupported) runBackgroundDownload()
      else runStreamDownload()
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

  const pauseDownload = () => { if (mode === 'stream') sessionRef.current?.pause() }
  const resumeDownload = () => { if (mode === 'stream') sessionRef.current?.resume() }
  const cancelDownload = () => {
    sessionRef.current?.cancel?.()
    sessionRef.current = null
    setMode(null)
    setStatus('idle')
    setProgress(IDLE_DOWNLOAD_PROGRESS)
  }

  const progressLabel = progress.phase === 'ready'
    ? 'Downloaded — tap to save'
    : progress.phase === 'complete'
      ? 'Download complete'
      : progress.phase === 'error'
        ? 'Download failed'
        : progress.phase === 'handoff'
          ? 'Starting device download…'
          : progress.phase === 'preparing'
            ? 'Preparing video…'
            : status === 'paused'
              ? 'Paused'
              : mode === 'background'
                ? 'Downloading in background…'
                : 'Downloading video…'
  const progressPercent = progress.total ? Math.min(100, progress.percent || 0) : (progress.phase === 'complete' || progress.phase === 'ready' ? 100 : 6)
  const busyLabel = progress.phase === 'downloading' && progress.total ? `Downloading ${progress.percent}%` : status === 'paused' ? 'Paused' : 'Starting download…'
  const showControls = !isLocalResolver && (status === 'loading' || status === 'paused') && progress.phase !== 'handoff' && progress.phase !== 'complete'

  return (
    <div className="mv-download-control">
      {!isLocalResolver && status === 'idle' && isRestrictiveWebView() && <p className="mv-webview-note">⚠ Downloads may not save properly inside this in-app browser. For a reliable save, tap ⋮ and choose "Open in Chrome" or "Open in Safari".</p>}
      {!isLocalResolver && status === 'idle' && bgSupported && <label className="mv-download-bg-toggle">
        <input type="checkbox" checked={background} onChange={event => setBackground(event.target.checked)} />
        <span>Background download (keeps going if you close the app)</span>
      </label>}
      {status === 'ready'
        ? <button type="button" className="mv-download-btn is-ready" onClick={saveReadyDownload} disabled={saving}>
            <span className="mv-download-status">{saving ? <span className="mv-download-spinner" aria-hidden="true" /> : null}{saving ? 'Saving…' : '💾 Save to device'}</span>
          </button>
        : <a className={`mv-download-btn${status === 'error' ? ' is-error' : ''}${status === 'paused' ? ' is-paused' : ''}`} href={href || '#'} download={filename || fallbackName} rel="noopener noreferrer" referrerPolicy="no-referrer" aria-busy={status === 'loading'} onClick={startDownload}>
            <span className="mv-download-status" role={status === 'loading' ? 'status' : undefined}>
              {status === 'loading' ? <span className="mv-download-spinner" aria-hidden="true" /> : null}
              {status === 'loading' ? busyLabel : status === 'paused' ? '⏸ Paused — tap resume' : status === 'error' ? '⚠ Retry download' : `⬇ ${label}`}
            </span>
            {size ? <span className="mv-download-size">{size}</span> : null}
          </a>}
      {showControls && <div className="mv-download-controls">
        {mode === 'stream' && status === 'loading' && <button type="button" className="mv-download-mini-btn" onClick={pauseDownload}>⏸ Pause</button>}
        {mode === 'stream' && status === 'paused' && <button type="button" className="mv-download-mini-btn" onClick={resumeDownload}>▶ Resume</button>}
        <button type="button" className="mv-download-mini-btn is-cancel" onClick={cancelDownload}>✕ Cancel</button>
      </div>}
      {progress.phase !== 'idle' && <div className={`mv-download-progress${progress.phase === 'error' ? ' is-error' : progress.phase === 'complete' ? ' is-complete' : progress.phase === 'ready' ? ' is-ready' : status === 'paused' ? ' is-paused' : ''}`} role="status" aria-live="polite">
        <div className="mv-download-progress-head"><span>{progressLabel}{mode === 'background' && progress.phase === 'downloading' ? ' 📱' : ''}</span><strong>{progress.total || progress.phase === 'complete' || progress.phase === 'ready' ? `${progress.total ? progress.percent : 100}%` : '…'}</strong></div>
        <div className="mv-download-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress.total || progress.phase === 'complete' ? progressPercent : undefined} aria-valuetext={progress.total || progress.phase === 'complete' ? `${progressPercent}%` : 'Download starting'}><span style={{ width: `${progressPercent}%` }} /></div>
        <div className="mv-download-progress-stats"><span>{formatBytes(progress.loaded)}{progress.total ? ` / ${formatBytes(progress.total)}` : ''}</span><span>{progress.speed > 0 ? `${formatBytes(progress.speed)}/s` : progress.phase === 'complete' ? 'Ready' : status === 'paused' ? 'Paused' : 'Connecting…'}</span><span>{progress.phase === 'ready' ? 'Not saved yet' : progress.phase === 'complete' ? (progress.savedVia === 'share' ? 'Saved — check Files app' : 'Saved to Downloads') : progress.phase === 'error' ? 'Try again' : status === 'paused' ? 'Tap resume to continue' : progress.total && progress.phase === 'downloading' ? formatEta(progress.eta) : 'Preparing…'}</span></div>
      </div>}
    </div>
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
      request(animeHint ? 'anime-play' : liveHint ? 'live-stream-meta' : tvHint ? 'tv-seasons' : 'play', { id, res: 720, se: tvHint && !liveHint ? season : '', ep: tvHint && !liveHint ? episode : '' }),
      liveHint ? Promise.resolve({ data: { items: [] } }) : request(tvHint ? 'tv-recommend' : 'movie-recommend', { id }),
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
  const stream = mediaUrl(movie.subjectId, resolution, episodic ? season : '', episodic ? episode : '', 'stream')
  const directDownload = live ? '' : mediaUrl(movie.subjectId, resolution, episodic ? season : '', episodic ? episode : '', 'download', d.title)
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
              {playing ? <StableVideo key={`${movie.subjectId}:${season}:${episode}:${resolution}:${streamRetry}`} resetKey={`${movie.subjectId}:${season}:${episode}:${resolution}:${streamRetry}`} src={stream} captions={captions} poster={cover(d)} onRetry={() => setStreamRetry(value => value + 1)} /> : <div className="mv-video-wrap mv-video-placeholder" onClick={() => setPlaying(true)}><img src={cover(d)} alt="" /><div className="mv-placeholder-content"><span className="mv-play-large">▶</span><span>{live ? 'Click to watch live' : episodic ? `Select an episode or play S${season} E${episode}` : 'Click to stream'}</span></div></div>}
              <p className="mv-stream-caption">⚡ TOOSIIFLIX player · {resolution}p direct MP4{live ? ' · live relay' : episodic ? ` · S${season} E${episode}` : ''}</p>
            </section>

            {episodic && seasons.length > 0 && <section className="mv-eps-panel">
              <div className="mv-eps-head"><div className="mv-eps-title"><span className="mv-player-dot" />Seasons <div className="mv-eps-seasons">{seasons.map(value => <button key={value} className={`mv-eps-season-btn${Number(season) === Number(value) ? ' active' : ''}`} onClick={() => { setSeason(value); setEpisode(1) }}>S{value}</button>)}</div></div><div className="mv-eps-nav"><span className="mv-eps-now">S{season} · E{episode}</span><button className="mv-eps-nav-btn" disabled={episode <= 1} onClick={() => watchEpisode(season, Math.max(1, episode - 1))}>← Prev</button><button className="mv-eps-nav-btn mv-eps-next" disabled={episode >= currentEpisodes.length} onClick={() => watchEpisode(season, Math.min(currentEpisodes.length, episode + 1))}>Next →</button></div></div>
              <div className="mv-eps-strip">{currentEpisodes.map(value => <button key={value} className={`mv-eps-ep${Number(episode) === Number(value) && playing ? ' active' : ''}`} onClick={() => watchEpisode(season, value)}><span className="mv-eps-ep-num">E{value}</span><span className="mv-eps-ep-label">Episode {value}</span></button>)}</div>
            </section>}

            {!live && downloads.length > 0 && <section className="mv-download-section"><div className="mv-download-head">⬇ Available downloads <span className="mv-count">{downloads.length} files</span></div><div className="mv-download-grid">{downloads.map(file => <DownloadButton key={`${file.resourceId}-${file.resolution}`} href={mediaUrl(d.subjectId, file.resolution || resolution, episodic ? season : '', episodic ? episode : '', 'download', d.title)} label={`${file.resolution || resolution}p`} filename={file.filename || daveFilename(d.title, file.resolution || resolution, episodic ? season : '', episodic ? episode : '')} size={file.size ? `${Math.round(Number(file.size) / 1048576)} MB` : ''} item={d} season={episodic ? season : ''} episode={episodic ? episode : ''} mediaKind={kind} />)}</div></section>}

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
  const [rails, setRails] = useState({ home: [], trending: [], moviePopular: [], movieNew: [], movieTop: [], tvPopular: [], tvTrending: [], tvNew: [], animeTrending: [], animeBrowse: [], live: [] })
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [type, setType] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [catalogMode, setCatalogMode] = useState('moviePopular')
  const [selected, setSelected] = useState(null)
  const [pendingSaves, setPendingSaves] = useState([]) // background downloads claimed but not yet saved (need a real tap)
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
      const popularItems = getItems(moviePopular)
      setHero(popularItems[0] || trendItems[0] || null)
      setRails({ home: homeSections.flatMap(section => section.items || []).slice(0, 20), trending: trendItems, moviePopular: getItems(moviePopular), movieNew: getItems(movieNew), movieTop: [], tvPopular: [], tvTrending: getItems(tvTrending), tvNew: [], animeTrending: animeSections.flatMap(section => section.items || []).slice(0, 20), animeBrowse: [], live: getItems(live) })
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const requestedCatalog = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('catalog') : ''
    if (requestedCatalog && ['trending', 'moviePopular', 'movieNew', 'movieTop', 'tvPopular', 'tvTrending', 'tvNew', 'animeTrending', 'animeBrowse', 'live'].includes(requestedCatalog)) setCatalogMode(requestedCatalog)
  }, [])

  // Reached when the user taps the "Download complete" notification the service worker
  // shows once a background download finishes after the app was closed — pull the
  // finished file back out of the cache and queue it for the person to tap-save
  // (auto-saving here has no live user gesture behind it and browsers can silently
  // drop that, which is exactly the "says saved, isn't on disk" bug this avoids).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const resumeId = new URLSearchParams(window.location.search).get('resumeDownload')
    if (!resumeId) return
    claimBackgroundDownload(resumeId).then(result => {
      if (result?.blob) setPendingSaves(current => [...current, { id: resumeId, blob: result.blob, filename: result.filename }])
    }).finally(() => {
      const url = new URL(window.location.href)
      url.searchParams.delete('resumeDownload')
      window.history.replaceState({}, '', url.toString())
    })
  }, [])

  // Sweep up any background downloads that finished while no tab was open to receive
  // the postMessage and whose completion notification was dismissed/never tapped.
  useEffect(() => {
    claimAllPendingBackgroundDownloads().then(found => {
      if (found.length) setPendingSaves(current => [...current, ...found])
    })
  }, [])

  const savePending = async entry => {
    const result = await saveBlobToDevice(entry.blob, entry.filename)
    if (!result?.canceled) setPendingSaves(current => current.filter(item => item.id !== entry.id))
  }

  useEffect(() => {
    if (!query.trim() || results.length > 0) { setSuggestions([]); return undefined }
    let active = true
    const timer = setTimeout(() => request('suggest', { q: query, limit: 6 }).then(payload => { if (active) setSuggestions(payload?.data || []) }).catch(() => { if (active) setSuggestions([]) }), 250)
    return () => { active = false; clearTimeout(timer) }
  }, [query, results.length])

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
    if (!query.trim()) { setResults([]); setSuggestions([]); return }
    setSuggestions([])
    setSearching(true)
    try { const payload = await request('search', { q: query, type }); setResults(payload?.data?.items || payload?.data?.subjectList || []) } catch { setResults([]) }
    setSearching(false)
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
    await shareOrCopy({ title: `${shareTitle} — Toosii Tech Movies`, text: '', url: link.toString() })
  }

  const shareMovieSearch = async () => {
    if (!query.trim()) return
    const link = new URL('/tools/movies/watch', window.location.origin)
    link.searchParams.set('q', query.trim()); if (type) link.searchParams.set('type', type)
    await shareOrCopy({ title: `Search movies for ${query.trim()} — Toosii Tech`, text: `Browse movie results for ${query.trim()}`, url: link.toString() })
  }

  const display = results.length ? results : trending
  const railItems = catalogMode === 'trending' ? trending : (rails[catalogMode] || [])
  const railTitle = { trending: 'Trending Now', moviePopular: 'Popular Movies', movieNew: 'New Releases', movieTop: 'Most Watched Movies', tvPopular: 'Popular Series', tvTrending: 'Trending Series', tvNew: 'New Series', animeTrending: 'Trending Anime', animeBrowse: 'Browse Anime', live: 'Live Events & Replays' }[catalogMode] || 'Browse Catalog'
  const railActions = { trending: 'trending', moviePopular: 'movie-popular', movieNew: 'movie-new', movieTop: 'movie-top', tvPopular: 'tv-popular', tvTrending: 'tv-trending', tvNew: 'tv-new', animeTrending: 'anime-trending', animeBrowse: 'anime-browse', live: 'live' }

  return (
    <div className="mv-page">
      <header className="mv-topbar">
        <a className="mv-brand" href="/tools/movies" aria-label="TOOSIIFLIX home"><span className="mv-brand-mark">T</span><span>TOOSII<span>FLIX</span></span></a>
        <nav className="mv-main-nav" aria-label="TOOSIIFLIX navigation"><a className="active" href="/tools/movies">Home</a><a href="/tools/movies?catalog=moviePopular">Movies</a><a href="/tools/movies?catalog=tvPopular">TV Series</a><a href="/tools/movies?catalog=live">Live</a><a href="/tools/movies?catalog=animeTrending">Anime</a></nav>
        <div className="mv-top-actions"><a href="/library" aria-label="My Library">▱</a><a href="/search" aria-label="Global Search">⌕</a></div>
      </header>
      {hero && <div className="mv-hero" onClick={() => setSelected(hero)}>
        <div className="mv-hero-bg" style={{ backgroundImage: `url(${cover(hero)})` }} /><div className="mv-hero-gradient" />
        <div className="mv-hero-content"><div className="mv-hero-badge">TOOSIIFLIX · FEATURED NOW</div><h1 className="mv-hero-title">{hero.title}</h1><div className="mv-hero-meta">{year(hero) && <span>📅 {year(hero)}</span>}{hero.imdbRatingValue && <span>⭐ {hero.imdbRatingValue}</span>}{hero.genre && <span>🎭 {String(hero.genre).split(',')[0]}</span>}<span>{isLive(hero) ? '🔴 Live' : isAnime(hero) ? '✨ Anime' : isTV(hero) ? '📺 Series' : '🎬 Movie'}</span></div><p className="mv-hero-desc">{hero.description || `Watch ${hero.title} with the ToosiiFlix streaming experience.`}</p><div className="mv-hero-btns"><button className="mv-hero-play-btn" onClick={event => { event.stopPropagation(); setSelected(hero) }}>▶ Play Now</button><button className="mv-hero-info-btn" onClick={event => { event.stopPropagation(); setSelected(hero) }}>ℹ More Info</button></div></div>
      </div>}

      <nav className="mv-utility-nav" aria-label="TOOSIIFLIX quick access"><a href="#catalog">Browse Catalog</a><a href="#discover">Find by Genre</a><a href="/tools/movies?catalog=animeTrending">✨ Anime</a><a href="/tools/movies?catalog=live">🔴 Live TV</a></nav>
      <div className="mv-search-wrap"><form className="mv-search-row" onSubmit={handleSearch}><span className="mv-search-icon">🔍</span><input className="mv-search-input" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search movies, series, anime, live…" aria-label="Search movies, series, anime, and live events" /><select className="mv-search-type" value={type} onChange={event => setType(event.target.value)} aria-label="Content type"><option value="">All</option><option value="1">Movies</option><option value="2">Series</option><option value="anime">Anime</option><option value="live">Live</option></select><button type="submit" className="mv-search-btn">Search</button></form>{suggestions.length > 0 && <div className="mv-suggestions">{suggestions.map((suggestion, index) => <button key={`${suggestion.subjectId || suggestion.title || index}`} type="button" onClick={() => { setQuery(suggestion.title || suggestion.name || ''); setSuggestions([]) }}>{suggestion.title || suggestion.name || 'Suggestion'}</button>)}</div>}</div>

      {results.length > 0 ? <section className="mv-section"><div className="mv-section-head"><h2 className="mv-section-title"><span className="mv-section-bar" />Results for “{query}”</h2><div className="mv-section-actions"><button className="mv-share-search-btn" onClick={shareMovieSearch}>↗ Share Search</button><button className="mv-clear-btn" onClick={() => { setResults([]); setQuery('') }}>✕ Clear</button><span className="mv-count">{results.length} titles</span></div></div><div className="mv-grid">{results.map(movie => <Card key={movie.subjectId} movie={movie} onClick={setSelected} onShare={shareMovie} />)}</div></section> : <>
        {loading ? <section className="mv-section"><div className="mv-grid">{Array.from({ length: 12 }).map((_, index) => <Skeleton key={index} />)}</div></section> : null}
        <section className="mv-catalog-controls" id="catalog"><div><span className="mv-catalog-eyebrow">TOOSIIFLIX CATALOG</span><h2>Choose your next watch</h2><p>Browse popular titles, new releases, series, anime, live events, and curated shelves from one calm home.</p></div><div className="mv-catalog-tabs" role="tablist" aria-label="TOOSIIFLIX catalog shelves">{[['moviePopular', 'Movie Popular'], ['movieNew', 'Movie New'], ['movieTop', 'Movie Top'], ['trending', 'Trending'], ['tvPopular', 'TV Popular'], ['tvTrending', 'TV Trending'], ['tvNew', 'TV New'], ['animeTrending', 'Anime Trending'], ['animeBrowse', 'Anime Browse'], ['live', 'Live Events']].map(([id, label]) => <button key={id} className={catalogMode === id ? 'active' : ''} onClick={() => { setCatalogMode(id); if (id !== 'trending' && !rails[id]?.length) loadRail(railActions[id]) }}>{label}</button>)}</div></section>
        {!loading && <Rail title={railTitle} items={railItems} onSelect={setSelected} onShare={shareMovie} />}
        {rails.home.length > 0 && <Rail title="Curated for you" items={rails.home} onSelect={setSelected} onShare={shareMovie} />}
      </>}

      <section className="mv-discover-bar" id="discover"><div><span className="mv-catalog-eyebrow">DISCOVER ON TOOSIIFLIX</span><h2>Find by genre</h2></div><div className="mv-discover-actions">{['Action', 'Drama', 'Comedy', 'Romance', 'Sci-Fi'].map(genre => <button key={genre} onClick={() => loadRail('discover', { contentType: 'MOVIE', genre })}>{genre}</button>)}</div></section>

      {selected && <Modal movie={selected} onClose={() => setSelected(null)} onSelect={setSelected} onShare={shareMovie} />}
      {pendingSaves.length > 0 && (
        <div className="mv-pending-saves" role="status" aria-live="polite">
          {pendingSaves.map(entry => (
            <div key={entry.id} className="mv-pending-save-item">
              <span className="mv-pending-save-name">💾 {entry.filename}</span>
              <button type="button" onClick={() => savePending(entry)}>Save to device</button>
            </div>
          ))}
        </div>
      )}
      <footer className="mv-footer">
        <div className="mv-footer-main"><div><a className="mv-footer-brand" href="/tools/movies"><span className="mv-brand-mark">T</span> TOOSIIFLIX</a><p>Your next watch is waiting. Explore movies, series, anime, and live events with Toosii Tech.</p></div><div className="mv-footer-links"><div><strong>Browse</strong><a href="#catalog">Catalog</a><a href="/tools/movies?catalog=movieNew">New Releases</a><a href="/tools/movies?catalog=live">Live TV</a></div><div><strong>Toosii Tech</strong><a href="/contact">Contact</a><a href="/copyright">Copyright</a><a href="/terms">Terms</a></div></div></div>
        <div className="mv-footer-bottom">© {new Date().getFullYear()} Toosii Tech · TOOSIIFLIX · Use responsibly</div>
      </footer>
    </div>
  )
}
