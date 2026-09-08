'use client'
import Layout from '../../../components/Layout'
import { useState, useEffect, useRef } from 'react'
import { shareOrCopy } from '../../../lib/clientShare'
import { isRestrictiveWebView } from '../../../lib/downloadManager'
import { useBackNavigation } from '../../../lib/useBackNavigation'
import './audio.css'

const GT = 'https://api.giftedtech.co.ke/api/download'
const STEPS = ['Fetching video info…', 'Converting to MP3…', 'Finalising…']

function proxyUrl(url, title, author, thumbnail) {
  const clean = value => String(value || '')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const safeTitle = clean(title)
  const safeAuthor = clean(author)
  const combined = safeTitle && safeAuthor && safeTitle.toLowerCase().includes(safeAuthor.toLowerCase())
    ? safeTitle
    : [safeAuthor, safeTitle].filter(Boolean).join(' - ')
  const name = (combined || 'audio').slice(0, 120) + '.mp3'
  const params = new URLSearchParams({ url, name })
  if (title) params.set('title', title)
  if (author) params.set('artist', author)
  if (thumbnail) params.set('thumbnail', thumbnail)
  params.set('album', 'Toosii Downloads')
  return `/api/download/proxy?${params.toString()}`
}

function ytId(url) {
  const m = String(url || '').match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

function ytThumb(url) {
  const id = ytId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
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

export default function AudioDownloader({ shared = null }) {
  const [mode, setMode]               = useState('url')
  const [url, setUrl]                 = useState('')
  const [query, setQuery]             = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching]     = useState(false)
  const [searchError, setSearchError] = useState('')
  const [result, setResult]           = useState(null)
  const [loading, setLoading]         = useState(false)
  const [downloadState, setDownloadState] = useState({ phase: 'idle' }) // idle | checking | error
  const [step, setStep]               = useState(0)
  const [error, setError]             = useState('')
  const [selectedId, setSelectedId]   = useState(null)
  const closeResult = useBackNavigation(!!result, () => setResult(null))
    const [playingId,     setPlayingId]     = useState(null)
  const [playingTitle, setPlayingTitle] = useState('')
  const [playingArtist, setPlayingArtist] = useState('')
  const [playingUrl,    setPlayingUrl]    = useState('')
  const closePlaying = useBackNavigation(!!playingId, () => setPlayingId(null))
  const sharedLoaded = useRef(false)

  const [trending, setTrending]       = useState([])
  const [trendingLoading, setTrendingLoading] = useState(true)

  useEffect(() => {
    fetch('/api/search/youtube?q=' + encodeURIComponent('trending songs 2025'))
      .then(r => r.json())
      .then(d => { if (d.results?.length) setTrending(d.results) })
      .catch(() => {})
      .finally(() => setTrendingLoading(false))
  }, [])

  useEffect(() => {
    if (!shared || sharedLoaded.current) return
    sharedLoaded.current = true

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

    if (shared.url) {
      setUrl(shared.url)
      setPlayingUrl(shared.url)
      setPlayingId(shared.id || ytId(shared.url))
      setPlayingTitle(shared.title || 'Shared song')
      setPlayingArtist(shared.artist || '')
      setMode('url')
    }
  }, [shared])

  const search = async () => {
    const q = query.trim()
    if (!q) return setSearchError('Enter a song or video name to search')
    setSearching(true); setSearchError(''); setSearchResults([]); setPlayingId(null)
    try {
      const res = await fetch(`/api/search/youtube?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data.results?.length) setSearchResults(data.results)
      else setSearchError('No results found — try a different search term')
    } catch { setSearchError('Search failed — check your connection and try again') }
    finally { setSearching(false) }
  }

  const download = async (overrideUrl) => {
    const trimmed = (overrideUrl || url).trim()
    if (!trimmed) return setError('Paste a YouTube URL first')
    if (!/youtube\.com|youtu\.be/i.test(trimmed)) return setError('Only YouTube links are supported for MP3 download')
    setLoading(true); setError(''); setResult(null); setStep(0)
    setDownloadState({ phase: 'preparing', loaded: 0, total: 0, percent: 0, speed: 0, eta: null })
    const timer = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 7000)
    try {
      const serverData = await (await fetch('/api/download/audio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: trimmed }) })).json()
      if (serverData.download_url) {
        setResult(serverData)
        setDownloadState({ phase: 'ready', loaded: 0, total: 0, percent: 0, speed: 0, eta: null })
        clearInterval(timer); setLoading(false); return
      }
      setStep(1)
      const gtData = await (await fetch(`${GT}/ytmp3?apikey=gifted&url=${encodeURIComponent(trimmed)}`)).json()
      if (gtData.success && gtData.result?.download_url) {
        const d = gtData.result
        setResult({ download_url: d.download_url, title: d.title, author: d.author || d.artist || d.uploader || d.channel, thumbnail: d.thumbnail || ytThumb(trimmed), duration: fmtDuration(d.duration), quality: d.quality || '128kbps' })
        setDownloadState({ phase: 'ready', loaded: 0, total: 0, percent: 0, speed: 0, eta: null })
        clearInterval(timer); setLoading(false); return
      }
      const msg = gtData.message || 'Could not extract audio. The conversion service is busy — please try again.'
      setError(msg.includes('Limit') ? 'Download service is temporarily overloaded. Please try again in a few minutes.' : msg)
    } catch { setError('Network error — please check your connection and try again.') }
    finally { clearInterval(timer); setLoading(false) }
  }

  // Plain, browser-native download: pointing the anchor's href/download attributes at
  // the proxy URL hands the whole transfer to the browser's own download manager end
  // to end — the same mechanism as clicking any normal download link. That's what
  // actually registers in chrome://downloads and lands in the real Downloads folder,
  // with no JS-simulated save step in the middle that can silently fail.
  const downloadHref = result?.download_url ? proxyUrl(result.download_url, result.title, result.author, result.thumbnail) : ''
  const downloadFilename = result ? `${[result.author, result.title].filter(Boolean).join(' - ') || 'audio'}.mp3` : 'audio.mp3'

  const onDownloadClick = () => {
    setError('')
    setDownloadState({ phase: 'complete' })
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
    setPlayingArtist(item.channel || '')
    setPlayingUrl(item.url || `https://youtu.be/${item.id}`)
    setResult(null)
    setError('')
  }

  const shareAudio = async ({ sourceUrl = playingUrl || url, title = playingTitle || result?.title || 'Shared song', artist = playingArtist || result?.author || '', thumbnail = result?.thumbnail || ytThumb(sourceUrl), duration = result?.duration || '', quality = result?.quality || '' } = {}) => {
    if (!sourceUrl) return setError('Open a song before sharing it')
    const link = new URL('/downloader/audio/share', window.location.origin)
    link.searchParams.set('url', sourceUrl)
    link.searchParams.set('title', title)
    if (artist) link.searchParams.set('artist', artist)
    if (thumbnail) link.searchParams.set('thumbnail', thumbnail)
    if (duration) link.searchParams.set('duration', duration)
    if (quality) link.searchParams.set('quality', quality)
    await shareOrCopy({ title: `${title} — Toosii Tech`, text: `Listen to ${title}${artist ? ` by ${artist}` : ''} on Toosii Tech`, url: link.toString() })
  }

  const switchMode = (m) => {
    setMode(m); setResult(null); setError(''); setSearchError('')
    setDownloadState({ phase: 'idle', loaded: 0, total: 0, percent: 0, speed: 0, eta: null })
    setSearchResults([]); setSelectedId(null); setPlayingId(null)
  }

  return (
    <Layout>
      <section className="dl-hero">
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>🎧</span> MP3 Downloader</div>
          <h1 className="section-title">YouTube to MP3. <span className="gradient-text">In Seconds.</span></h1>
          <p className="section-sub">Search any song by name or paste a YouTube link. Preview it first, then download as MP3. No account, no ads, no limits.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="dl-card glass-card">

            {/* Mode tabs */}
            <div className="mode-tabs">
              <button className={`mode-tab ${mode === 'url' ? 'active' : ''}`} onClick={() => switchMode('url')}>🔗 Paste URL</button>
              <button className={`mode-tab ${mode === 'search' ? 'active' : ''}`} onClick={() => switchMode('search')}>🎵 Search by Song Name</button>
            </div>

            {/* URL mode */}
            {mode === 'url' && (
              <div className="dl-search-wrapper">
                <span className="dl-search-icon">🔗</span>
                <input type="url" placeholder="Paste YouTube URL here…" value={url} onChange={e => { setUrl(e.target.value); setError('') }} className="dl-search-input" onKeyDown={e => e.key === 'Enter' && !loading && download()} disabled={loading} />
                <button onClick={() => download()} disabled={loading} className="dl-search-btn">{loading ? 'Converting…' : '🎵 Get MP3'}</button>
              </div>
            )}

            {/* Search mode */}
            {mode === 'search' && (
              <div>
                <div className="dl-search-wrapper">
                  <span className="dl-search-icon">🔍</span>
                  <input type="text" placeholder='Search a song — e.g. "Tshwala Bami", "Rema Calm Down"…' value={query} onChange={e => { setQuery(e.target.value); setSearchError('') }} className="dl-search-input" onKeyDown={e => e.key === 'Enter' && !searching && search()} disabled={searching || loading} />
                  <button onClick={search} disabled={searching || loading} className="dl-search-btn">{searching ? 'Searching…' : '🔍 Search'}</button>
                </div>
                {searchError && <div className="error-box" style={{ marginTop: '0.75rem' }}>{searchError}</div>}
                {searching && <div className="progress-box" style={{ marginTop: '0.75rem' }}><div className="spinner" /><span>Searching YouTube…</span></div>}
              </div>
            )}

            {loading && <div className="progress-box"><div className="spinner" /><span>{STEPS[step]}</span><span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748b' }}>may take 20–40s</span></div>}
            {error && <div className="error-box" style={{ marginTop: '1rem' }}>{error}</div>}

            {/* Inline player */}
            {playingId && (
              <div className="inline-player">
                <div className="player-header">
                  <div className="player-now">
                    <span className="player-live-dot" />
                    <span className="player-now-label">Preview</span>
                    {playingTitle && <span className="player-title-text">{playingTitle}</span>}
                    {playingArtist && <span className="player-artist-text">by {playingArtist}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button onClick={() => shareAudio()} className="player-share-btn">↗ Share</button>
                    <button onClick={closePlaying} className="player-close-btn">✕ Close</button>
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
                    onClick={() => pickResult({ id: playingId, url: playingUrl || `https://youtu.be/${playingId}`, title: playingTitle, channel: playingArtist })}
                    className="btn-primary"
                    disabled={loading}
                  >{loading ? 'Converting…' : '🎵 Download as MP3'}</button>
                  <button onClick={closePlaying} className="btn-outline">← Back to results</button>
                </div>
              </div>
            )}

            {/* Search results */}
            {mode === 'search' && searchResults.length > 0 && !playingId && !result && (
              <div className="search-results">
                <p className="results-label">{searchResults.length} results — click to preview, or hit Get MP3</p>
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
                          <span className="rc-play-label">▶ Preview</span>
                          <button type="button" className="rc-share-btn" onClick={e => { e.stopPropagation(); shareAudio({ sourceUrl: item.url || `https://youtu.be/${item.id}`, title: item.title, artist: item.channel, thumbnail: item.thumbnail, duration: item.duration }) }}>↗</button>
                          <button
                            className="rc-dl-btn"
                            onClick={e => !loading && pickResult(item, e)}
                            disabled={loading}
                          >{loading && selectedId === item.id ? <span className="rc-spinner" /> : '🎵'} Get MP3</button>
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
                  <span className="platform-tag">▶ YouTube</span>
                  {result.title  && <h3 className="result-title">{result.title}</h3>}
                  {result.author && <p className="result-author">by {result.author}</p>}
                  <div className="result-meta">
                    <span className="badge">🎵 MP3</span>
                    {result.quality  && <span className="badge">🎚 {result.quality}</span>}
                    {result.duration && <span className="badge">⏱ {result.duration}</span>}
                  </div>
                  <p className="expire-note">⚡ Download now — this link expires soon</p>
                  {isRestrictiveWebView() && (
                    <p className="audio-webview-note">⚠ Downloads may not save properly inside this in-app browser. For a reliable save, tap ⋮ and choose &quot;Open in Chrome&quot; or &quot;Open in Safari&quot;.</p>
                  )}
                  {downloadState.phase === 'complete' && (
                    <div className="audio-download-complete" role="status">✓ Download started — check your notifications or Downloads folder</div>
                  )}
                  <div className="dl-buttons">
                    <a href={downloadHref} download={downloadFilename} onClick={onDownloadClick} className="btn-primary" style={{ width: 'fit-content' }}>⬇ Download MP3</a>
                    <button type="button" onClick={() => shareAudio({ sourceUrl: url, title: result.title, artist: result.author, thumbnail: result.thumbnail, duration: result.duration, quality: result.quality })} className="btn-secondary">↗ Share Song</button>
                    {mode === 'search' && <button onClick={() => { closeResult(); setSelectedId(null) }} className="btn-outline" style={{ width: 'fit-content', fontSize: '0.85rem' }}>← Back</button>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Trending section */}
          {!result && !playingId && !(mode === 'search' && searchResults.length > 0) && (
            <div className="trending-section">
              <div className="trending-header">
                <div>
                  <h2 className="trending-title">🔥 Trending <span className="gradient-text">Music</span></h2>
                  <p className="trending-sub">Hot songs right now — preview then download as MP3</p>
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
                          <span className="rc-play-label">▶ Preview</span>
                          <button type="button" className="rc-share-btn" onClick={e => { e.stopPropagation(); shareAudio({ sourceUrl: item.url || `https://youtu.be/${item.id}`, title: item.title, artist: item.channel, thumbnail: item.thumbnail, duration: item.duration }) }}>↗</button>
                          <button
                            className="rc-dl-btn"
                            onClick={e => { e.stopPropagation(); !loading && pickResult(item, e) }}
                            disabled={loading}
                          >{loading && selectedId === item.id ? <span className="rc-spinner" /> : '🎵'} Get MP3</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          <div className="tips-grid">
            {[
              { icon: '🔍', title: 'Search by Name',   desc: 'Type any song name — no URL needed.' },
              { icon: '▶',  title: 'Preview First',     desc: 'Watch before you download — no surprises.' },
              { icon: '🎵', title: 'High Quality MP3',  desc: 'Clear audio, fast conversion.' },
              { icon: '🔒', title: 'No Sign-up',        desc: 'No account, no login, no tracking.' },
            ].map(t => (
              <div key={t.title} className="tip-card glass-card">
                <span className="tip-icon">{t.icon}</span>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  )
}
