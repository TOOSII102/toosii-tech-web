'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import './audio.css'

export default function AudioDownloader() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const download = async () => {
    if (!url.trim()) return setError('Paste a YouTube URL first')
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/download/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })
      const data = await res.json()
      if (data.download_url) {
        setResult(data)
      } else {
        setError(data.error || 'Could not fetch audio. Try a different URL.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <section className="dl-hero">
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>🎧</span> MP3 Downloader</div>
          <h1 className="section-title">Download Audio in High Quality</h1>
          <p className="section-sub">Extract MP3 audio from any YouTube video. Fast, free, no ads, no sign-up required.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="dl-card glass-card">
            <div className="dl-input-row">
              <input
                type="url"
                placeholder="Paste YouTube URL here…"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="text-input"
                onKeyDown={e => e.key === 'Enter' && download()}
              />
              <button onClick={download} disabled={loading} className="btn-primary">
                {loading ? 'Processing…' : 'Get MP3'}
              </button>
            </div>

            {error && <div className="error-box" style={{ marginTop: '1rem' }}>{error}</div>}

            {result && (
              <div className="result-panel">
                {result.thumbnail && (
                  <img src={result.thumbnail} alt="Thumbnail" className="thumb" />
                )}
                <div className="result-info">
                  {result.title && <h3 className="result-title">{result.title}</h3>}
                  <div className="result-meta">
                    <span className="badge">🎵 MP3</span>
                    {result.duration && <span className="badge">⏱ {result.duration}</span>}
                  </div>
                  <a href={result.download_url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ width: 'fit-content', marginTop: '1rem' }}>
                    ⬇ Download MP3
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="tips-grid">
            {[
              { icon: '⚡', title: 'Fast Processing', desc: 'Most downloads ready in under 10 seconds.' },
              { icon: '🎵', title: 'High Quality', desc: '128kbps MP3 audio, clear and clean.' },
              { icon: '🔒', title: 'No Sign-up', desc: 'No account, no login, no tracking.' },
              { icon: '📱', title: 'Mobile Friendly', desc: 'Works perfectly on your phone.' },
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
