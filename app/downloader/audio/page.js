'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import './audio.css'

const GT = 'https://api.giftedtech.co.ke/api/download'

const STEPS = ['Fetching video info…', 'Converting to MP3…', 'Finalising…']

function proxyUrl(url, title) {
  const name = (title ? title.replace(/[^a-z0-9\s-]/gi, '').trim().slice(0, 60) : 'audio') + '.mp3'
  return `/api/download/proxy?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`
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
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const sec = secs % 60
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

  /* ── Search ── */
  const search = async () => {
    const q = query.trim()
    if (!q) return setSearchError('Enter a song or video name to search')
    setSearching(true); setSearchError(''); setSearchResults([])
    try {
      const res = await fetch(`/api/search/youtube?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data.results?.length) {
        setSearchResults(data.results)
      } else {
        setSearchError('No results found — try a different search term')
      }
    } catch {
      setSearchError('Search failed — check your connection and try again')
    } finally {
      setSearching(false)
    }
  }

  /* ── Download ── */
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
        body: JSON.stringify({ url: trimmed })
      })
      const serverData = await serverRes.json()

      if (serverData.download_url) {
        setResult(serverData)
        clearInterval(timer); setLoading(false)
        return
      }

      setStep(1)
      const enc = encodeURIComponent(trimmed)
      const gtRes = await fetch(`${GT}/ytmp3?apikey=gifted&url=${enc}`)
      const gtData = await gtRes.json()

      if (gtData.success && gtData.result?.download_url) {
        const d = gtData.result
        setResult({
          download_url: d.download_url,
          title:     d.title,
          thumbnail: d.thumbnail || ytThumb(trimmed),
          duration:  fmtDuration(d.duration),
          quality:   d.quality || '128kbps',
        })
        clearInterval(timer); setLoading(false)
        return
      }

      const msg = gtData.message || 'Could not extract audio. The conversion service is busy — please try again in a few minutes.'
      setError(msg.includes('Limit') ? 'Download service is temporarily overloaded. Please try again in a few minutes.' : msg)

    } catch {
      setError('Network error — please check your connection and try again.')
    } finally {
      clearInterval(timer)
      setLoading(false)
    }
  }

  /* ── Pick a search result → download it ── */
  const pickResult = (item) => {
    setSelectedId(item.id)
    setUrl(item.url)
    setResult(null)
    setError('')
    download(item.url)
  }

  const switchMode = (m) => {
    setMode(m)
    setResult(null)
    setError('')
    setSearchError('')
    setSearchResults([])
    setSelectedId(null)
  }

  return (
    <Layout>
      <section className="dl-hero">
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>🎧</span> MP3 Downloader</div>
          <h1 className="section-title">YouTube to MP3. <span className="gradient-text">In Seconds.</span></h1>
          <p className="section-sub">Search any song by name or paste a YouTube link — get a high-quality MP3 file instantly. No account, no ads, no limits.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="dl-card glass-card">

            {/* Mode tabs */}
            <div className="mode-tabs">
              <button
                className={`mode-tab ${mode === 'url' ? 'active' : ''}`}
                onClick={() => switchMode('url')}
              >🔗 Paste URL</button>
              <button
                className={`mode-tab ${mode === 'search' ? 'active' : ''}`}
                onClick={() => switchMode('search')}
              >🎵 Search by Song Name</button>
            </div>

            {/* URL mode */}
            {mode === 'url' && (
              <div className="dl-search-wrapper">
                <span className="dl-search-icon">🔗</span>
                <input
                  type="url"
                  placeholder="Paste YouTube URL here…"
                  value={url}
                  onChange={e => { setUrl(e.target.value); setError('') }}
                  className="dl-search-input"
                  onKeyDown={e => e.key === 'Enter' && !loading && download()}
                  disabled={loading}
                />
                <button onClick={() => download()} disabled={loading} className="dl-search-btn">
                  {loading ? 'Converting…' : '🎵 Get MP3'}
                </button>
              </div>
            )}

            {/* Search mode */}
            {mode === 'search' && (
              <div>
                <div className="dl-search-wrapper">
                  <span className="dl-search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search a song — e.g. &quot;Tshwala Bami&quot;, &quot;Rema Calm Down&quot;…"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setSearchError('') }}
                    className="dl-search-input"
                    onKeyDown={e => e.key === 'Enter' && !searching && search()}
                    disabled={searching || loading}
                  />
                  <button onClick={search} disabled={searching || loading} className="dl-search-btn">
                    {searching ? 'Searching…' : '🔍 Search'}
                  </button>
                </div>
                {searchError && <div className="error-box" style={{ marginTop: '0.75rem' }}>{searchError}</div>}
                {searching && (
                  <div className="progress-box" style={{ marginTop: '0.75rem' }}>
                    <div className="spinner" />
                    <span>Searching YouTube…</span>
                  </div>
                )}
              </div>
            )}

            {loading && (
              <div className="progress-box">
                <div className="spinner" />
                <span>{STEPS[step]}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748b' }}>may take 20–40s</span>
              </div>
            )}
            {error && <div className="error-box" style={{ marginTop: '1rem' }}>{error}</div>}

            {/* Search results */}
            {mode === 'search' && searchResults.length > 0 && !result && (
              <div className="search-results">
                <p className="results-label">{searchResults.length} results — click a song to convert to MP3</p>
                <div className="results-grid">
                  {searchResults.map(item => (
                    <button
                      key={item.id}
                      className={`result-card ${selectedId === item.id ? 'selected' : ''} ${loading && selectedId === item.id ? 'loading' : ''}`}
                      onClick={() => !loading && pickResult(item)}
                      disabled={loading}
                    >
                      <div className="rc-thumb-wrap">
                        <img src={item.thumbnail} alt={item.title} className="rc-thumb" loading="lazy" />
                        {item.duration && <span className="rc-dur">{item.duration}</span>}
                        {loading && selectedId === item.id && (
                          <div className="rc-loading-overlay"><div className="spinner" /></div>
                        )}
                      </div>
                      <div className="rc-info">
                        <p className="rc-title">{item.title}</p>
                        {item.channel && <p className="rc-channel">{item.channel}</p>}
                      </div>
                    </button>
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
                    <a
                      href={proxyUrl(result.download_url, result.title)}
                      download
                      className="btn-primary"
                      style={{ width: 'fit-content' }}
                    >
                      ⬇ Download MP3
                    </a>
                    {mode === 'search' && (
                      <button
                        onClick={() => { setResult(null); setSelectedId(null) }}
                        className="btn-outline"
                        style={{ width: 'fit-content', fontSize: '0.85rem' }}
                      >← Back to results</button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="tips-grid">
            {[
              { icon: '🔍', title: 'Search by Name',   desc: 'Type any song or video name — no URL needed.' },
              { icon: '⚡', title: 'Fast Conversion',   desc: 'Your video converts to MP3 in seconds.' },
              { icon: '🎵', title: '128kbps MP3',       desc: 'High quality audio, clear and clean.' },
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
