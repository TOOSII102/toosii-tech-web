'use client'
import Layout from '../../../components/Layout'
import { useState, useEffect, useRef } from 'react'
import { shareOrCopy } from '../../../lib/clientShare'
import { supportsBackgroundFetch, createStreamDownload, createBackgroundDownload, claimBackgroundDownload, claimAllPendingBackgroundDownloads, saveBlobToDevice } from '../../../lib/downloadManager'
import './video.css'

const GT = 'https://api.giftedtech.co.ke/api/download'

const PLATFORM_LABELS = {
  youtube:   '▶ YouTube',
  tiktok:    '♪ TikTok',
  instagram: '📷 Instagram',
  facebook:  '👤 Facebook',
  twitter:   '✕ Twitter / X',
}

function detect(url) {
  if (/youtube\.com|youtu\.be/i.test(url))      return 'youtube'
  if (/tiktok\.com|vm\.tiktok\.com/i.test(url)) return 'tiktok'
  if (/instagram\.com/i.test(url))               return 'instagram'
  if (/facebook\.com|fb\.watch/i.test(url))      return 'facebook'
  if (/twitter\.com|x\.com/i.test(url))          return 'twitter'
  return null
}

const GT_MAP = { youtube: 'ytv', instagram: 'instadl', facebook: 'facebook', twitter: 'twitter' }

function proxyUrl(url, title, ext = 'mp4') {
  const name = (title ? title.replace(/[^a-z0-9\s-]/gi, '').trim().slice(0, 60) : 'video') + '.' + ext
  return `/api/download/proxy?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`
}

function fmtDuration(raw) {
  if (!raw) return null
  const s = String(raw).trim()
  if (/^\d+:\d+/.test(s)) return s
  const secs = Math.floor(Number(s))
  if (isNaN(secs) || secs < 0) return null
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), sec = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${m}:${String(sec).padStart(2,'0')}`
}

function ytId(url) {
  const m = String(url || '').match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

function ytThumb(url) {
  const id = ytId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function formatEta(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return 'Calculating…'
  if (seconds < 60) return `${Math.max(1, Math.ceil(seconds))}s left`
  const minutes = Math.floor(seconds / 60)
  const remaining = Math.ceil(seconds % 60)
  return `${minutes}m ${String(remaining).padStart(2, '0')}s left`
}

const IDLE_PROGRESS = { phase: 'idle', loaded: 0, total: 0, percent: 0, speed: 0, eta: null }

/**
 * Drop-in replacement for a plain `<a href download>` link. Streams the file itself so
 * it can offer real Pause / Resume / Cancel, and — when `background` is enabled and the
 * browser supports it — hands the transfer to the Background Fetch API so it keeps going
 * even if the tab or app is closed.
 */
function DownloadLink({ href, label, filename, className, style, background, bgSupported }) {
  const [status, setStatus] = useState('idle') // idle | loading | paused | error
  const [progress, setProgress] = useState(IDLE_PROGRESS)
  const modeRef = useRef(null) // 'stream' | 'background'
  const sessionRef = useRef(null)

  useEffect(() => () => { if (modeRef.current === 'stream') sessionRef.current?.pause?.() }, [])

  const runStream = () => {
    modeRef.current = 'stream'
    let lastLoaded = 0
    const session = createStreamDownload({
      url: href,
      onProgress: ({ loaded, total, speed }) => {
        const remaining = total > loaded && speed > 0 ? (total - loaded) / speed : null
        setProgress({ phase: 'downloading', loaded, total, percent: total ? Math.min(100, Math.round((loaded / total) * 100)) : 0, speed, eta: remaining })
        lastLoaded = loaded
      },
      onStateChange: next => {
        if (next === 'connecting') { setStatus('loading'); setProgress({ ...IDLE_PROGRESS, phase: 'preparing' }) }
        if (next === 'downloading') setStatus('loading')
        if (next === 'paused') setStatus('paused')
        if (next === 'error') { setStatus('error'); setProgress({ ...IDLE_PROGRESS, phase: 'error', loaded: lastLoaded }); window.setTimeout(() => setStatus('idle'), 4000) }
      },
    })
    sessionRef.current = session
    session.start().then(() => {
      if (session.state !== 'complete') return
      if (!session.loaded) throw new Error('Empty download')
      saveBlobToDevice(session.getBlob(), filename)
      setProgress({ phase: 'complete', loaded: session.loaded, total: session.total || session.loaded, percent: 100, speed: 0, eta: 0 })
      setStatus('idle')
    }).catch(() => {
      if (session.state === 'canceled' || session.state === 'paused') return
      setStatus('error')
      setProgress({ ...IDLE_PROGRESS, phase: 'error' })
      window.setTimeout(() => setStatus('idle'), 4000)
    })
  }

  const runBackground = async () => {
    modeRef.current = 'background'
    setStatus('loading')
    setProgress({ ...IDLE_PROGRESS, phase: 'downloading' })
    let fellBack = false
    try {
      const session = await createBackgroundDownload({
        url: href,
        filename,
        title: filename,
        onProgress: ({ loaded, total }) => {
          setProgress({ phase: 'downloading', loaded, total, percent: total ? Math.min(100, Math.round((loaded / total) * 100)) : 0, speed: 0, eta: null })
        },
        onStateChange: next => {
          if (next === 'complete') { setStatus('idle'); setProgress(current => ({ ...current, phase: 'complete', percent: 100 })) }
          if (next === 'error' && !fellBack) {
            // Stalled registration or a lost cache entry — fall back to the direct
            // engine instead of leaving the user stuck at "Connecting…".
            fellBack = true
            runStream()
          }
        },
      })
      sessionRef.current = session
    } catch {
      runStream()
    }
  }

  const start = event => {
    event.preventDefault()
    if (status === 'loading' || status === 'paused') return
    sessionRef.current = null
    if (background && bgSupported) runBackground()
    else runStream()
  }

  const pause = () => { if (modeRef.current === 'stream') sessionRef.current?.pause() }
  const resume = () => { if (modeRef.current === 'stream') sessionRef.current?.resume() }
  const cancel = () => {
    sessionRef.current?.cancel?.()
    sessionRef.current = null
    modeRef.current = null
    setStatus('idle')
    setProgress(IDLE_PROGRESS)
  }

  const busy = status === 'loading' || status === 'paused'

  return (
    <div className="vd-download-wrap">
      <a href={href} download={filename} className={className} style={style} onClick={start} aria-busy={status === 'loading'}>
        {status === 'loading' ? (progress.total ? `Downloading ${progress.percent}%` : 'Starting…') : status === 'paused' ? '⏸ Paused' : status === 'error' ? '⚠ Retry' : label}
      </a>
      {busy && <div className="vd-download-controls">
        {modeRef.current === 'stream' && status === 'loading' && <button type="button" className="vd-mini-btn" onClick={pause}>⏸ Pause</button>}
        {modeRef.current === 'stream' && status === 'paused' && <button type="button" className="vd-mini-btn" onClick={resume}>▶ Resume</button>}
        <button type="button" className="vd-mini-btn is-cancel" onClick={cancel}>✕ Cancel</button>
      </div>}
      {progress.phase !== 'idle' && <div className={`vd-download-progress${progress.phase === 'error' ? ' is-error' : progress.phase === 'complete' ? ' is-complete' : status === 'paused' ? ' is-paused' : ''}`} role="status" aria-live="polite">
        <div className="vd-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress.total ? progress.percent : undefined}>
          <span style={{ width: `${progress.total ? progress.percent : (progress.phase === 'complete' ? 100 : 6)}%` }} />
        </div>
        <div className="vd-progress-stats">
          <span>{formatBytes(progress.loaded)}{progress.total ? ` / ${formatBytes(progress.total)}` : ''}</span>
          <span>{progress.speed > 0 ? `${formatBytes(progress.speed)}/s` : progress.phase === 'complete' ? 'Saved' : status === 'paused' ? 'Paused' : 'Connecting…'}</span>
          <span>{progress.phase === 'complete' ? '✓ Done' : progress.phase === 'error' ? 'Failed' : status === 'paused' ? 'Tap resume' : formatEta(progress.eta)}</span>
        </div>
      </div>}
    </div>
  )
}

const STEPS = ['Detecting platform…', 'Fetching video info…', 'Preparing download link…']

export default function VideoDownloader({ shared = null }) {
  const [mode, setMode]               = useState('url')
  const [url, setUrl]                 = useState('')
  const [query, setQuery]             = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching]     = useState(false)
  const [searchError, setSearchError] = useState('')
  const [result, setResult]           = useState(null)
  const [loading, setLoading]         = useState(false)
  const [step, setStep]               = useState(0)
  const [error, setError]             = useState('')
  const [selectedId, setSelectedId]   = useState(null)
  const [playingId, setPlayingId]     = useState(null)
  const [playingTitle, setPlayingTitle] = useState('')
  const [playingUrl, setPlayingUrl]   = useState('')
  const sharedLoaded = useRef(false)
  const [trending, setTrending]       = useState([])
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [background, setBackground]   = useState(false)
  const bgSupported = supportsBackgroundFetch()

  useEffect(() => {
    fetch('/api/search/youtube?q=' + encodeURIComponent('trending videos 2025'))
      .then(r => r.json())
      .then(d => { if (d.results?.length) setTrending(d.results) })
      .catch(() => {})
      .finally(() => setTrendingLoading(false))
  }, [])

  // Reached when the user taps the "Download complete" notification the service worker
  // shows once a background video download finishes after the app was closed.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const resumeId = new URLSearchParams(window.location.search).get('resumeDownload')
    if (!resumeId) return
    claimBackgroundDownload(resumeId).then(result => {
      if (result?.blob) saveBlobToDevice(result.blob, result.filename)
    }).finally(() => {
      const link = new URL(window.location.href)
      link.searchParams.delete('resumeDownload')
      window.history.replaceState({}, '', link.toString())
    })
  }, [])

  // Sweep up any background downloads that finished while no tab was open to receive
  // the postMessage and whose completion notification was dismissed/never tapped.
  useEffect(() => { claimAllPendingBackgroundDownloads() }, [])

  const search = async () => {
    const q = query.trim()
    if (!q) return setSearchError('Enter a video name to search')
    setSearching(true); setSearchError(''); setSearchResults([])
    setPlayingId(null)
    try {
      const res = await fetch(`/api/search/youtube?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data.results?.length) setSearchResults(data.results)
      else setSearchError('No results found — try a different search term')
    } catch { setSearchError('Search failed — check your connection and try again') }
    finally { setSearching(false) }
  }

  useEffect(() => {
    if (!shared || sharedLoaded.current) return
    sharedLoaded.current = true

    const sharedUrl = shared.url || ''
    const sharedId = shared.id || ytId(sharedUrl)
    if (sharedUrl) setUrl(sharedUrl)

    if (shared.query) {
      setMode('search')
      setQuery(shared.query)
      setSearching(true)
      fetch(`/api/search/youtube?q=${encodeURIComponent(shared.query)}`)
        .then(r => r.json())
        .then(data => setSearchResults(data.results || []))
        .catch(() => setSearchError('This shared search could not be loaded.'))
        .finally(() => setSearching(false))
    }

    if (sharedUrl && sharedId) {
      setPlayingId(sharedId)
      setPlayingTitle(shared.title || 'Shared video')
      setPlayingUrl(sharedUrl)
      setMode('url')
    } else if (sharedUrl) {
      download(sharedUrl)
    }
  }, [shared])

  const download = async (overrideUrl) => {
    const trimmed = (overrideUrl || url).trim()
    if (!trimmed) return setError('Paste a video URL first')
    const platform = detect(trimmed)
    if (!platform) return setError('Unsupported URL. Paste a YouTube, TikTok, Instagram, Facebook or Twitter link.')
    setLoading(true); setError(''); setResult(null); setStep(0)
    const timer = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 6000)
    try {
      const enc = encodeURIComponent(trimmed)
      if (platform === 'tiktok') {
        const res = await fetch('/api/download/video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: trimmed }) })
        const data = await res.json()
        if (data.download_url) { setResult(data); return }
        setStep(2)
        try {
          const gt = await (await fetch(`${GT}/tiktok?apikey=gifted&url=${enc}`)).json()
          if (gt.success && gt.result?.download_url) { setResult({ platform, download_url: gt.result.download_url, title: gt.result.title, thumbnail: gt.result.thumbnail, duration: fmtDuration(gt.result.duration), author: gt.result.author }); return }
          const msg = gt.message || ''
          setError(msg.includes('Limit') ? 'TikTok download service is temporarily overloaded. Please try again in a few minutes.' : 'Could not download TikTok video. Try again shortly.')
        } catch { setError('Could not download TikTok video. Check your connection and try again.') }
        return
      }
      setStep(1)
      const serverData = await (await fetch('/api/download/video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: trimmed }) })).json()
      if (serverData.download_url) { setResult(serverData); return }
      setStep(2)
      if (!GT_MAP[platform]) { setError(`Platform ${platform} is temporarily unavailable.`); return }
      const d = await (await fetch(`${GT}/${GT_MAP[platform]}?apikey=gifted&url=${enc}`)).json()
      if (platform === 'youtube' && d.success && d.result?.download_url) { setResult({ platform, download_url: d.result.download_url, title: d.result.title, thumbnail: d.result.thumbnail || ytThumb(trimmed), quality: d.result.quality, duration: fmtDuration(d.result.duration) }); return }
      if (platform === 'instagram' && d.success && d.result?.download_url) { setResult({ platform, download_url: d.result.download_url, thumbnail: d.result.thumbnail, title: 'Instagram Reel' }); return }
      if (platform === 'facebook' && d.success && (d.result?.hd_video || d.result?.sd_video)) { setResult({ platform, download_url: d.result.hd_video || d.result.sd_video, download_url_sd: d.result.sd_video || null, title: d.result.title, thumbnail: d.result.thumbnail, duration: fmtDuration(d.result.duration), quality: d.result.hd_video ? 'HD' : 'SD' }); return }
      if (platform === 'twitter' && d.success && d.result?.videoUrls?.length) { const sorted = [...d.result.videoUrls].sort((a,b) => (parseInt(b.quality)||0)-(parseInt(a.quality)||0)); setResult({ platform, download_url: sorted[0].url, thumbnail: d.result.thumbnail, quality: sorted[0].quality, title: 'Twitter / X Video', all_qualities: sorted }); return }
      const msg = d.message || ''
      setError(msg.includes('Limit') ? 'Download service is temporarily overloaded. Please try again in a few minutes.' : `Could not download from ${PLATFORM_LABELS[platform] || platform}. Try again shortly.`)
    } catch { setError('Network error — please check your connection and try again.') }
    finally { clearInterval(timer); setLoading(false) }
  }

  const pickResult = (item, e) => {
    if (e) e.stopPropagation()
    setSelectedId(item.id)
    setPlayingId(null)
    setUrl(item.url)
    setResult(null)
    setError('')
    download(item.url)
  }

  const playVideo = (item) => {
    setPlayingId(item.id)
    setPlayingTitle(item.title)
    setPlayingUrl(item.url || `https://youtu.be/${item.id}`)
    setResult(null)
    setError('')
  }

  const shareVideo = async ({ url: sharedUrl = playingUrl || url, title = playingTitle || result?.title || 'Shared video', thumbnail = result?.thumbnail || ytThumb(sharedUrl), platform = result?.platform || detect(sharedUrl) || 'youtube' } = {}) => {
    if (!sharedUrl) return setError('Open a video before sharing it')
    const link = new URL('/downloader/video/share', window.location.origin)
    link.searchParams.set('url', sharedUrl)
    link.searchParams.set('title', title)
    if (thumbnail) link.searchParams.set('thumbnail', thumbnail)
    if (platform) link.searchParams.set('platform', platform)
    await shareOrCopy({ title: `${title} — Toosii Tech`, text: `Watch ${title} on Toosii Tech`, url: link.toString() })
  }

  const switchMode = (m) => {
    setMode(m); setResult(null); setError(''); setSearchError('')
    setSearchResults([]); setSelectedId(null); setPlayingId(null)
  }

  return (
    <Layout>
      <section className="dl-hero">
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>🎬</span> Video Downloader</div>
          <h1 className="section-title">Download Any Video. <span className="gradient-text">Instantly.</span></h1>
          <p className="section-sub">Search by name or paste a URL — YouTube, TikTok, Instagram, Facebook, Twitter / X. Play before you download. HD quality, no account needed.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="dl-card glass-card">

            {/* Mode tabs */}
            <div className="mode-tabs">
              <button className={`mode-tab ${mode === 'url' ? 'active' : ''}`} onClick={() => switchMode('url')}>🔗 Paste URL</button>
              <button className={`mode-tab ${mode === 'search' ? 'active' : ''}`} onClick={() => switchMode('search')}>🔍 Search by Name</button>
            </div>

            {/* URL mode */}
            {mode === 'url' && (
              <div className="dl-search-wrapper">
                <span className="dl-search-icon">🔗</span>
                <input type="url" placeholder="Paste video URL here… (YouTube, TikTok, Instagram, Facebook, Twitter…)" value={url} onChange={e => { setUrl(e.target.value); setError('') }} className="dl-search-input" onKeyDown={e => e.key === 'Enter' && !loading && download()} disabled={loading} />
                <button onClick={() => download()} disabled={loading} className="dl-search-btn">{loading ? 'Processing…' : '⬇ Download'}</button>
              </div>
            )}

            {/* Search mode */}
            {mode === 'search' && (
              <div>
                <div className="dl-search-wrapper">
                  <span className="dl-search-icon">🔍</span>
                  <input type="text" placeholder='Search YouTube — e.g. "Tshwala Bami" or "Mr Bean funny clips"…' value={query} onChange={e => { setQuery(e.target.value); setSearchError('') }} className="dl-search-input" onKeyDown={e => e.key === 'Enter' && !searching && search()} disabled={searching || loading} />
                  <button onClick={search} disabled={searching || loading} className="dl-search-btn">{searching ? 'Searching…' : '🔍 Search'}</button>
                </div>
                {searchError && <div className="error-box" style={{ marginTop: '0.75rem' }}>{searchError}</div>}
                {searching && <div className="progress-box" style={{ marginTop: '0.75rem' }}><div className="spinner" /><span>Searching YouTube…</span></div>}
              </div>
            )}

            {loading && <div className="progress-box"><div className="spinner" /><span>{STEPS[step]}</span></div>}
            {error && <div className="error-box" style={{ marginTop: '1rem' }}>{error}</div>}

            {/* Inline player */}
            {playingId && (
              <div className="inline-player">
                <div className="player-header">
                  <div className="player-now">
                    <span className="player-live-dot" />
                    <span className="player-now-label">Now Playing</span>
                    {playingTitle && <span className="player-title-text">{playingTitle}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button onClick={() => shareVideo()} className="player-share-btn">↗ Share</button>
                    <button onClick={() => setPlayingId(null)} className="player-close-btn">✕ Close</button>
                  </div>
                </div>
                <div className="player-frame-wrap">
                  <iframe
                    src={`https://www.youtube.com/embed/${playingId}?autoplay=1&rel=0&modestbranding=1`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="player-frame"
                    title={playingTitle}
                  />
                </div>
                <div className="player-actions">
                  <button
                    onClick={() => { pickResult({ id: playingId, url: `https://youtu.be/${playingId}`, title: playingTitle }) }}
                    className="btn-primary"
                    disabled={loading}
                  >{loading ? 'Processing…' : '⬇ Download Video'}</button>
                  <button onClick={() => setPlayingId(null)} className="btn-outline">← Back to results</button>
                </div>
              </div>
            )}

            {/* Search results */}
            {mode === 'search' && searchResults.length > 0 && !playingId && !result && (
              <div className="search-results">
                <p className="results-label">{searchResults.length} results — click to play, or hit Download</p>
                <div className="results-grid">
                  {searchResults.map(item => (
                    <div
                      key={item.id}
                      className={`result-card ${selectedId === item.id && loading ? 'loading' : ''}`}
                      onClick={() => !loading && playVideo(item)}
                    >
                      <div className="rc-thumb-wrap">
                        <img src={item.thumbnail} alt={item.title} className="rc-thumb" loading="lazy" />
                        {item.duration && <span className="rc-dur">{item.duration}</span>}
                        <div className="rc-play-overlay"><span className="rc-play-icon">▶</span></div>
                      </div>
                      <div className="rc-info">
                        <p className="rc-title">{item.title}</p>
                        {item.channel  && <p className="rc-channel">{item.channel}</p>}
                        {(item.views || item.uploaded) && <p className="rc-meta">{[item.views, item.uploaded].filter(Boolean).join(' · ')}</p>}
                        <div className="rc-actions">
                          <span className="rc-play-label">▶ Play</span>
                          <button type="button" className="rc-share-btn" onClick={e => { e.stopPropagation(); shareVideo({ url: item.url || `https://youtu.be/${item.id}`, title: item.title, thumbnail: item.thumbnail, platform: 'youtube' }) }}>↗</button>
                          <button
                            className="rc-dl-btn"
                            onClick={e => !loading && pickResult(item, e)}
                            disabled={loading}
                          >{loading && selectedId === item.id ? <span className="rc-spinner" /> : '⬇'} Download</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Download result */}
            {result && (
              <div className="result-panel">
                {result.thumbnail && <img src={result.thumbnail} alt="Thumbnail" className="thumb" />}
                <div className="result-info">
                  {result.platform && <span className="platform-tag">{PLATFORM_LABELS[result.platform] || result.platform}</span>}
                  {result.title    && <h3 className="result-title">{result.title}</h3>}
                  {result.author   && <p className="result-author">by {result.author}</p>}
                  <div className="result-meta">
                    {result.quality  && <span className="badge">📺 {result.quality}</span>}
                    {result.duration && <span className="badge">⏱ {result.duration}</span>}
                  </div>
                  <p className="expire-note">⚡ Download now — this link expires soon</p>
                  {bgSupported && <label className="vd-bg-toggle">
                    <input type="checkbox" checked={background} onChange={e => setBackground(e.target.checked)} />
                    <span>Background download (keeps going if you close the app)</span>
                  </label>}
                  <div className="dl-buttons">
                    <DownloadLink href={proxyUrl(result.download_url, result.title)} filename={(result.title ? result.title.replace(/[^a-z0-9\s-]/gi, '').trim().slice(0, 60) : 'video') + '.mp4'} label={`⬇ Download ${result.quality || 'Video'}`} className="btn-primary" style={{ width: 'fit-content' }} background={background} bgSupported={bgSupported} />
                    <button type="button" onClick={() => shareVideo({ url, title: result.title, thumbnail: result.thumbnail, platform: result.platform })} className="btn-secondary">↗ Share Video</button>
                    {result.download_url_sd && <DownloadLink href={proxyUrl(result.download_url_sd, result.title ? result.title + ' SD' : null)} filename={(result.title ? result.title + ' SD' : 'video') + '.mp4'} label="⬇ SD Quality" className="btn-secondary" style={{ width: 'fit-content' }} background={background} bgSupported={bgSupported} />}
                    {mode === 'search' && <button onClick={() => { setResult(null); setSelectedId(null) }} className="btn-outline" style={{ width: 'fit-content', fontSize: '0.85rem' }}>← Back</button>}
                  </div>
                  {result.all_qualities?.length > 1 && (
                    <div className="quality-list">
                      <p className="quality-label">All qualities:</p>
                      {result.all_qualities.map((q, i) => <DownloadLink key={i} href={proxyUrl(q.url, result.title ? `${result.title} ${q.quality}` : null)} filename={(result.title ? `${result.title} ${q.quality}` : 'video') + '.mp4'} label={q.quality} className="quality-chip" background={background} bgSupported={bgSupported} />)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Trending section */}
          {!result && !playingId && !(mode === 'search' && searchResults.length > 0) && (
            <div className="trending-section">
              <div className="trending-header">
                <div>
                  <h2 className="trending-title">🔥 Trending <span className="gradient-text">Videos</span></h2>
                  <p className="trending-sub">Popular right now — click to play, hit Download to save</p>
                </div>
                <span className="trending-live-badge">● Live</span>
              </div>

              {trendingLoading ? (
                <div className="trending-skeletons">
                  {[...Array(8)].map((_, i) => <div key={i} className="trending-skeleton" />)}
                </div>
              ) : trending.length > 0 ? (
                <div className="results-grid">
                  {trending.map(item => (
                    <div
                      key={item.id}
                      className={`result-card ${selectedId === item.id && loading ? 'loading' : ''}`}
                      onClick={() => !loading && playVideo(item)}
                    >
                      <div className="rc-thumb-wrap">
                        <img src={item.thumbnail} alt={item.title} className="rc-thumb" loading="lazy" />
                        {item.duration && <span className="rc-dur">{item.duration}</span>}
                        <div className="rc-play-overlay"><span className="rc-play-icon">▶</span></div>
                      </div>
                      <div className="rc-info">
                        <p className="rc-title">{item.title}</p>
                        {item.channel && <p className="rc-channel">{item.channel}</p>}
                        {(item.views || item.uploaded) && <p className="rc-meta">{[item.views, item.uploaded].filter(Boolean).join(' · ')}</p>}
                        <div className="rc-actions">
                          <span className="rc-play-label">▶ Play</span>
                          <button type="button" className="rc-share-btn" onClick={e => { e.stopPropagation(); shareVideo({ url: item.url || `https://youtu.be/${item.id}`, title: item.title, thumbnail: item.thumbnail, platform: 'youtube' }) }}>↗</button>
                          <button
                            className="rc-dl-btn"
                            onClick={e => { e.stopPropagation(); !loading && pickResult(item, e) }}
                            disabled={loading}
                          >{loading && selectedId === item.id ? <span className="rc-spinner" /> : '⬇'} Download</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          <div className="platforms">
            <p className="section-label" style={{ marginBottom: '1rem' }}>Supported Platforms</p>
            <div className="platform-grid">
              {['YouTube', 'TikTok', 'Instagram', 'Facebook', 'Twitter / X'].map(p => (
                <div key={p} className="platform-chip glass-card">{p}</div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
