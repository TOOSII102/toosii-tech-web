'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import './spotify.css'

const STEPS = ['Fetching track info…', 'Converting to MP3…', 'Finalising…']

function fmt(dur) {
  if (!dur) return null
  const s = Math.floor(typeof dur === 'number' && dur > 1000 ? dur / 1000 : dur)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function proxyUrl(url, title) {
  const name = (title ? title.replace(/[^a-z0-9\s-]/gi, '').trim().slice(0, 60) : 'track') + '.mp3'
  return `/api/download/proxy?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`
}

export default function SpotifyDownloader() {
  const [mode, setMode]           = useState('url')
  const [url, setUrl]             = useState('')
  const [query, setQuery]         = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [loadingId, setLoadingId] = useState(null)
  const [step, setStep]           = useState(0)
  const [error, setError]         = useState('')

  const search = async () => {
    const q = query.trim()
    if (!q) return setSearchError('Enter a song or artist name to search')
    setSearching(true); setSearchError(''); setSearchResults([])
    try {
      const res = await fetch(`/api/search/spotify?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data.results?.length) setSearchResults(data.results)
      else setSearchError('No results found — try a different search term')
    } catch { setSearchError('Search failed — check your connection') }
    finally { setSearching(false) }
  }

  const downloadByUrl = async () => {
    const trimmed = url.trim()
    if (!trimmed) return setError('Paste a Spotify track URL first')
    if (!/open\.spotify\.com/i.test(trimmed)) return setError('Only Spotify track links are supported')
    setLoading(true); setError(''); setResult(null); setStep(0)
    const timer = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 7000)
    try {
      const res = await fetch('/api/download/spotify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: trimmed }) })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error || 'Download failed — try again.'); return }
      setResult(data)
    } catch { setError('Network error — please check your connection and try again.') }
    finally { clearInterval(timer); setLoading(false) }
  }

  const downloadFromDeezer = async (track) => {
    setLoadingId(track.id); setError(''); setResult(null); setStep(0)
    const timer = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 7000)
    try {
      const q = `${track.title} ${track.artist}`
      const ytRes = await fetch(`/api/search/youtube?q=${encodeURIComponent(q)}`)
      const ytData = await ytRes.json()
      const ytUrl = ytData.results?.[0]?.url
      if (!ytUrl) { setError('Could not find this song on YouTube to convert. Try again.'); return }
      const dlRes = await fetch('/api/download/audio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: ytUrl }) })
      const dlData = await dlRes.json()
      if (dlData.download_url) { setResult({ ...dlData, title: track.title, artist: track.artist, thumbnail: track.cover }); return }
      setStep(1)
      const gt = await (await fetch(`https://api.giftedtech.co.ke/api/download/ytmp3?apikey=gifted&url=${encodeURIComponent(ytUrl)}`)).json()
      if (gt.success && gt.result?.download_url) {
        setResult({ download_url: gt.result.download_url, title: track.title, artist: track.artist, thumbnail: track.cover, quality: gt.result.quality || '128kbps', duration: track.duration })
      } else {
        setError('Could not convert this track. Try again in a moment.')
      }
    } catch { setError('Network error — please check your connection.') }
    finally { clearInterval(timer); setLoadingId(null) }
  }

  const switchMode = (m) => {
    setMode(m); setResult(null); setError(''); setSearchError(''); setSearchResults([])
  }

  const isDownloading = loading || loadingId !== null

  return (
    <Layout>
      <section className="dl-hero" style={{ padding: '4.5rem 0 2.5rem' }}>
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>🎧</span> Spotify Downloader</div>
          <h1 className="section-title">Spotify to MP3. <span className="gradient-text">Free & Fast.</span></h1>
          <p className="section-sub">Search any song by name or paste a Spotify link — download as high-quality MP3. No premium needed, no account required.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="tool-card glass-card" style={{ maxWidth: 820, margin: '0 auto 2.5rem' }}>

            {/* Mode tabs */}
            <div className="mode-tabs">
              <button className={`mode-tab ${mode === 'url' ? 'active' : ''}`} onClick={() => switchMode('url')}>🔗 Paste Spotify URL</button>
              <button className={`mode-tab ${mode === 'search' ? 'active' : ''}`} onClick={() => switchMode('search')}>🔍 Search by Song Name</button>
            </div>

            {/* URL mode */}
            {mode === 'url' && (
              <div className="dl-search-wrapper">
                <span className="dl-search-icon">🔗</span>
                <input type="url" placeholder="https://open.spotify.com/track/..." value={url} onChange={e => { setUrl(e.target.value); setError('') }} className="dl-search-input" onKeyDown={e => e.key === 'Enter' && !loading && downloadByUrl()} disabled={loading} />
                <button onClick={downloadByUrl} disabled={loading} className="dl-search-btn">{loading ? 'Fetching…' : '⬇ Download'}</button>
              </div>
            )}

            {/* Search mode */}
            {mode === 'search' && (
              <div>
                <div className="dl-search-wrapper">
                  <span className="dl-search-icon">🔍</span>
                  <input type="text" placeholder='Search a song — e.g. "Calm Down Rema", "Tshwala Bami"…' value={query} onChange={e => { setQuery(e.target.value); setSearchError('') }} className="dl-search-input" onKeyDown={e => e.key === 'Enter' && !searching && search()} disabled={searching || isDownloading} />
                  <button onClick={search} disabled={searching || isDownloading} className="dl-search-btn">{searching ? 'Searching…' : '🔍 Search'}</button>
                </div>
                {searchError && <div className="error-box">{searchError}</div>}
                {searching && <div className="progress-box" style={{ marginTop: '0.75rem' }}><div className="spinner" /><span>Searching Deezer…</span></div>}
              </div>
            )}

            {(loading || loadingId) && <div className="progress-box"><div className="spinner" /><span>{STEPS[step]}</span><span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748b' }}>may take 20–40s</span></div>}
            {error && <div className="error-box">{error}</div>}

            {/* Search results grid */}
            {mode === 'search' && searchResults.length > 0 && !result && (
              <div>
                <p className="results-label">{searchResults.length} tracks found — preview with the player, then download</p>
                <div className="sp-results-grid">
                  {searchResults.map(track => (
                    <div key={track.id} className="sp-card">
                      <div className="sp-cover-wrap">
                        {track.cover
                          ? <img src={track.cover} alt={track.title} className="sp-cover" loading="lazy" />
                          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#1db954,#128c7e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎵</div>
                        }
                        {track.duration > 0 && <span className="sp-dur-badge">{fmt(track.duration)}</span>}
                      </div>
                      <div className="sp-info">
                        <p className="sp-title">{track.title}</p>
                        <p className="sp-artist">{track.artist}{track.album ? ` · ${track.album}` : ''}</p>
                        {track.preview && (
                          <audio controls className="sp-preview" preload="none" src={track.preview} />
                        )}
                        <button
                          className={`sp-dl-btn ${loadingId === track.id ? 'downloading' : ''}`}
                          onClick={() => !isDownloading && downloadFromDeezer(track)}
                          disabled={isDownloading}
                        >
                          {loadingId === track.id
                            ? <><div className="spinner" style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />Converting…</>
                            : '🎵 Download MP3'
                          }
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Download result */}
            {result && (
              <div className="result-panel">
                {result.thumbnail && <img src={result.thumbnail} alt="Cover" className="thumb" />}
                <div className="result-info">
                  <span className="platform-tag">🎧 Spotify / Deezer</span>
                  <h3 className="result-title">{result.title}</h3>
                  {result.artist && <p className="result-artist">by {result.artist}</p>}
                  <div className="result-meta">
                    <span className="badge">🎵 MP3</span>
                    {result.quality  && <span className="badge">🎚 {result.quality}</span>}
                    {result.duration && <span className="badge">⏱ {fmt(result.duration)}</span>}
                  </div>
                  <p className="expire-note">⚡ Download now — this link expires soon</p>
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <a href={proxyUrl(result.download_url || result.download, result.title)} download className="btn-primary" style={{ width: 'fit-content', marginTop: '0.25rem' }}>⬇ Download MP3</a>
                    {mode === 'search' && <button onClick={() => { setResult(null); setLoadingId(null) }} className="btn-outline" style={{ width: 'fit-content', marginTop: '0.25rem', fontSize: '0.85rem' }}>← Back</button>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="tips-grid" style={{ maxWidth: 820, margin: '0 auto' }}>
            {[
              { icon: '🔍', title: 'Search by Name',   desc: 'No link needed — just type the song or artist.' },
              { icon: '▶',  title: '30-sec Preview',    desc: 'Listen before you download with the built-in player.' },
              { icon: '🎵', title: 'High Quality MP3',  desc: 'Clear audio, fast conversion, no watermarks.' },
              { icon: '🔒', title: 'No Sign-up',        desc: 'Zero accounts, zero tracking, zero cost.' },
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
