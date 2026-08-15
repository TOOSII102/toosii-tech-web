'use client'
import Layout from '../../../components/Layout'
import { useState, useEffect } from 'react'
import './audio.css'

const GT = 'https://api.giftedtech.co.ke/api/download'
const STEPS = ['Fetching video info…', 'Converting to MP3…', 'Finalising…']

function mp3Filename(title) {
  const base = title ? title.replace(/[^a-z0-9\s-]/gi, '').trim().slice(0, 60) : 'audio'
  return `${base || 'audio'}.mp3`
}

function proxyUrl(url, title) {
  return `/api/download/proxy?url=${encodeURIComponent(url)}&name=${encodeURIComponent(mp3Filename(title))}`
}

function ytThumb(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null
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

export default function AudioDownloader() {
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
    return () => {
      if (result?.isBlob && result.download_url) URL.revokeObjectURL(result.download_url)
    }
  }, [result])

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
    const timer = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 7000)
    try {
      const serverRes = await fetch('/api/download/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })
      const contentType = serverRes.headers.get('content-type') || ''

      // The local conversion path returns an actual audio/mpeg body. Keep it
      // in the browser as a Blob URL so the download link does not send a
      // client-only blob: URL back through the server proxy.
      if (serverRes.ok && contentType.toLowerCase().startsWith('audio/')) {
        const blob = await serverRes.blob()
        const title = serverRes.headers.get('x-title') || 'YouTube audio'
        setResult({
          download_url: URL.createObjectURL(blob),
          isBlob: true,
          fileName: mp3Filename(title),
          title,
          thumbnail: serverRes.headers.get('x-thumbnail') || ytThumb(trimmed),
          duration: fmtDuration(serverRes.headers.get('x-duration')),
          quality: serverRes.headers.get('x-quality') || '192kbps',
        })
        return
      }

      const serverData = await serverRes.json().catch(() => ({}))
      if (serverRes.ok && serverData.download_url) {
        setResult(serverData)
        return
      }

      // Keep the external provider fallback for deployments where local
      // ffmpeg is unavailable or YouTube blocks the server-side conversion.
      setStep(1)
      const gtRes = await fetch(`${GT}/ytmp3?apikey=gifted&url=${encodeURIComponent(trimmed)}`)
      const gtData = await gtRes.json().catch(() => ({}))
      if (gtRes.ok && gtData.success && gtData.result?.download_url) {
        const d = gtData.result
        setResult({ download_url: d.download_url, title: d.title, thumbnail: d.thumbnail || ytThumb(trimmed), duration: fmtDuration(d.duration), quality: d.quality || '128kbps' })
        return
      }
      const msg = gtData.message || serverData.error || 'Could not extract audio. The conversion service is busy — please try again.'
      setError(msg.includes('Limit') ? 'Download service is temporarily overloaded. Please try again in a few minutes.' : msg)
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
    setResult(null)
    setError('')
  }

  const switchMode = (m) => {
    setMode(m); setResult(null); setError(''); setSearchError('')
    setSearchResults([]); setSelectedId(null); setPlayingId(null)
  }

  return (
    <Layout>
      <section className="dl-hero">
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>🎧</span> MP3 Downloader</div>
          <h1 className="section-title">YouTube to MP3. <span className="gradient-text">In Seconds.</span></h1>
          <p className="section-sub">Start with a song or artist name, choose the right result, preview it, then download as MP3. Already have a YouTube link? You can paste it instead.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="dl-card glass-card">

            {/* Mode tabs */}
            <div className="mode-tabs">
              <button className={`mode-tab ${mode === 'url' ? 'active' : ''}`} onClick={() => switchMode('url')}>🔗 Paste YouTube Link</button>
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
                  </div>
                  <button onClick={() => setPlayingId(null)} className="player-close-btn">✕ Close</button>
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
                    onClick={() => pickResult({ id: playingId, url: `https://youtu.be/${playingId}`, title: playingTitle })}
                    className="btn-primary"
                    disabled={loading}
                  >{loading ? 'Converting…' : '🎵 Download as MP3'}</button>
                  <button onClick={() => setPlayingId(null)} className="btn-outline">← Back to results</button>
                </div>
              </div>
            )}

            {/* Search results */}
            {mode === 'search' && searchResults.length > 0 && !playingId && !result && (
              <div className="search-results">
                <p className="results-label">{searchResults.length} results — select a title to preview it or start the MP3 conversion</p>
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
                  <div className="dl-buttons">
                    <a href={result.isBlob ? result.download_url : proxyUrl(result.download_url, result.title)} download={result.isBlob ? result.fileName : undefined} className="btn-primary" style={{ width: 'fit-content' }}>⬇ Download MP3</a>
                    {mode === 'search' && <button onClick={() => { setResult(null); setSelectedId(null) }} className="btn-outline" style={{ width: 'fit-content', fontSize: '0.85rem' }}>← Back</button>}
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
