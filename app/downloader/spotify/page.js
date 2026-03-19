'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import '../../tools/tools.css'

export default function SpotifyDownloader() {
  const [url, setUrl]       = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const download = async () => {
    const trimmed = url.trim()
    if (!trimmed) return setError('Paste a Spotify track URL first')
    if (!/open\.spotify\.com/i.test(trimmed)) return setError('Only Spotify track links are supported')

    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/download/spotify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })
      const data = await res.json()
      if (!res.ok || data.error) return setError(data.error || 'Download failed.')
      setResult(data)
    } catch {
      setError('Network error — please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const fmt = (ms) => {
    if (!ms) return null
    const s = Math.floor(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  return (
    <Layout>
      <section className="tool-hero">
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>🎵</span> Spotify Downloader</div>
          <h1 className="section-title">Download Spotify Tracks</h1>
          <p className="section-sub">Paste any Spotify track link and download it as MP3. Free, no sign-up.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="tool-card glass-card">
            <div className="tool-input-row">
              <input
                type="url"
                placeholder="https://open.spotify.com/track/..."
                value={url}
                onChange={e => { setUrl(e.target.value); setError('') }}
                className="text-input"
                onKeyDown={e => e.key === 'Enter' && !loading && download()}
                disabled={loading}
              />
              <button onClick={download} disabled={loading} className="btn-primary">
                {loading ? 'Fetching…' : 'Download'}
              </button>
            </div>

            {loading && (
              <div className="progress-box">
                <div className="spinner" />
                <span>Fetching track info…</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748b' }}>may take 10–20s</span>
              </div>
            )}

            {error && <div className="error-box">{error}</div>}

            {result && (
              <div className="result-panel">
                {result.thumbnail && <img src={result.thumbnail} alt="Cover" className="thumb" />}
                <div className="result-info">
                  <h3 className="result-title">{result.title}</h3>
                  {result.artist && <p className="result-artist">by {result.artist}</p>}
                  <div className="result-meta">
                    <span className="badge">🎵 MP3</span>
                    {result.duration && <span className="badge">⏱ {fmt(result.duration)}</span>}
                  </div>
                  <p className="expire-note">⚡ Download now — this link expires soon</p>
                  <a
                    href={`/api/download/proxy?url=${encodeURIComponent(result.download)}&name=${encodeURIComponent((result.title || 'track').replace(/[^\w\s-]/g, '').trim().slice(0, 60) + '.mp3')}`}
                    download
                    className="btn-primary"
                    style={{ width: 'fit-content', marginTop: '0.75rem' }}
                  >
                    ⬇ Download MP3
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="tips-grid">
            {[
              { icon: '🎵', title: 'Spotify Tracks',    desc: 'Paste any public Spotify track link to download it.' },
              { icon: '⚡', title: 'Fast Download',     desc: 'Track info fetched in seconds.' },
              { icon: '🔒', title: 'No Sign-up',        desc: 'No account required. Just paste and download.' },
              { icon: '📱', title: 'Mobile Friendly',   desc: 'Works perfectly on phone and desktop.' },
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
