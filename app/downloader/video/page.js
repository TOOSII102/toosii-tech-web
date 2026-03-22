'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
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

const GT_MAP = {
  youtube:   'ytv',
  instagram: 'instadl',
  facebook:  'facebook',
  twitter:   'twitter',
}

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
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const sec = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${m}:${String(sec).padStart(2,'0')}`
}

function ytThumb(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null
}

const STEPS = ['Detecting platform…', 'Fetching video info…', 'Preparing download link…']

export default function VideoDownloader() {
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
    if (!q) return setSearchError('Enter a video name to search')
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
    if (!trimmed) return setError('Paste a video URL first')

    const platform = detect(trimmed)
    if (!platform) return setError('Unsupported URL. Paste a YouTube, TikTok, Instagram, Facebook or Twitter link.')

    setLoading(true); setError(''); setResult(null); setStep(0)
    const timer = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 6000)

    try {
      const enc = encodeURIComponent(trimmed)

      if (platform === 'tiktok') {
        const res = await fetch('/api/download/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed })
        })
        const data = await res.json()
        if (data.download_url) { setResult(data); return }
        setStep(2)
        try {
          const gtRes = await fetch(`${GT}/tiktok?apikey=gifted&url=${enc}`)
          const gt = await gtRes.json()
          if (gt.success && gt.result?.download_url) {
            setResult({
              platform, download_url: gt.result.download_url,
              title: gt.result.title, thumbnail: gt.result.thumbnail,
              duration: fmtDuration(gt.result.duration), author: gt.result.author,
            })
            return
          }
          const msg = gt.message || ''
          setError(msg.includes('Limit')
            ? 'TikTok download service is temporarily overloaded. Please try again in a few minutes.'
            : 'Could not download TikTok video. Try again shortly.')
        } catch {
          setError('Could not download TikTok video. Check your connection and try again.')
        }
        return
      }

      setStep(1)
      const serverRes = await fetch('/api/download/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed })
      })
      const serverData = await serverRes.json()
      if (serverData.download_url) { setResult(serverData); return }

      setStep(2)
      const endpoint = GT_MAP[platform]
      if (!endpoint) {
        setError(`Platform ${platform} is temporarily unavailable. Try again later.`)
        return
      }

      const gtRes = await fetch(`${GT}/${endpoint}?apikey=gifted&url=${enc}`)
      const d = await gtRes.json()

      if (platform === 'youtube' && d.success && d.result?.download_url) {
        setResult({
          platform, download_url: d.result.download_url,
          title: d.result.title, thumbnail: d.result.thumbnail || ytThumb(trimmed),
          quality: d.result.quality, duration: fmtDuration(d.result.duration),
        })
        return
      }
      if (platform === 'instagram' && d.success && d.result?.download_url) {
        setResult({
          platform, download_url: d.result.download_url,
          thumbnail: d.result.thumbnail, title: 'Instagram Reel',
        })
        return
      }
      if (platform === 'facebook' && d.success && (d.result?.hd_video || d.result?.sd_video)) {
        setResult({
          platform,
          download_url:    d.result.hd_video || d.result.sd_video,
          download_url_sd: d.result.sd_video || null,
          title: d.result.title, thumbnail: d.result.thumbnail,
          duration: fmtDuration(d.result.duration), quality: d.result.hd_video ? 'HD' : 'SD',
        })
        return
      }
      if (platform === 'twitter' && d.success && d.result?.videoUrls?.length) {
        const sorted = [...d.result.videoUrls].sort((a, b) => (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0))
        setResult({
          platform, download_url: sorted[0].url,
          thumbnail: d.result.thumbnail, quality: sorted[0].quality,
          title: 'Twitter / X Video', all_qualities: sorted,
        })
        return
      }

      const msg = d.message || ''
      setError(
        msg.includes('Limit')
          ? 'Download service is temporarily overloaded. Please try again in a few minutes.'
          : `Could not download from ${PLATFORM_LABELS[platform] || platform}. Try again shortly.`
      )
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
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>🎬</span> Video Downloader</div>
          <h1 className="section-title">Download Any Video. <span className="gradient-text">Instantly.</span></h1>
          <p className="section-sub">Search by name or paste a URL — YouTube, TikTok, Instagram, Facebook, Twitter / X. HD quality, no account needed.</p>
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
              >🔍 Search by Name</button>
            </div>

            {/* URL mode */}
            {mode === 'url' && (
              <div className="dl-search-wrapper">
                <span className="dl-search-icon">🔗</span>
                <input
                  type="url"
                  placeholder="Paste video URL here… (YouTube, TikTok, Instagram, Facebook, Twitter…)"
                  value={url}
                  onChange={e => { setUrl(e.target.value); setError('') }}
                  className="dl-search-input"
                  onKeyDown={e => e.key === 'Enter' && !loading && download()}
                  disabled={loading}
                />
                <button onClick={() => download()} disabled={loading} className="dl-search-btn">
                  {loading ? 'Processing…' : '⬇ Download'}
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
                    placeholder="Search YouTube — e.g. &quot;Tshwala Bami&quot; or &quot;Mr Bean funny clips&quot;…"
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
              </div>
            )}
            {error && <div className="error-box" style={{ marginTop: '1rem' }}>{error}</div>}

            {/* Search results */}
            {mode === 'search' && searchResults.length > 0 && !result && (
              <div className="search-results">
                <p className="results-label">{searchResults.length} results — click one to download</p>
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
                  {result.platform && (
                    <span className="platform-tag">{PLATFORM_LABELS[result.platform] || result.platform}</span>
                  )}
                  {result.title    && <h3 className="result-title">{result.title}</h3>}
                  {result.author   && <p className="result-author">by {result.author}</p>}
                  <div className="result-meta">
                    {result.quality  && <span className="badge">📺 {result.quality}</span>}
                    {result.duration && <span className="badge">⏱ {result.duration}</span>}
                  </div>
                  <p className="expire-note">⚡ Download now — this link expires soon</p>
                  <div className="dl-buttons">
                    <a href={proxyUrl(result.download_url, result.title)} download className="btn-primary" style={{ width: 'fit-content' }}>
                      ⬇ Download {result.quality || 'Video'}
                    </a>
                    {result.download_url_sd && (
                      <a href={proxyUrl(result.download_url_sd, result.title ? result.title + ' SD' : null)} download className="btn-secondary" style={{ width: 'fit-content' }}>
                        ⬇ Download SD
                      </a>
                    )}
                    {mode === 'search' && (
                      <button
                        onClick={() => { setResult(null); setSelectedId(null) }}
                        className="btn-outline"
                        style={{ width: 'fit-content', fontSize: '0.85rem' }}
                      >← Back to results</button>
                    )}
                  </div>
                  {result.all_qualities?.length > 1 && (
                    <div className="quality-list">
                      <p className="quality-label">All qualities:</p>
                      {result.all_qualities.map((q, i) => (
                        <a key={i} href={proxyUrl(q.url, result.title ? `${result.title} ${q.quality}` : null)} download className="quality-chip">
                          {q.quality}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="platforms">
            <p className="section-label" style={{ marginBottom: '1.5rem' }}>Supported Platforms</p>
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
