'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import './video.css'

export default function VideoDownloader() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const download = async () => {
    if (!url.trim()) return setError('Paste a video URL first')
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/download/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })
      const data = await res.json()
      if (data.download_url) {
        setResult(data)
      } else {
        setError(data.error || 'Could not fetch video. Try a different URL.')
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
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>🎬</span> Video Downloader</div>
          <h1 className="section-title">Download Videos in HD</h1>
          <p className="section-sub">YouTube, TikTok, Instagram, Facebook and more. Paste any video URL and get a direct download link.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="dl-card glass-card">
            <div className="dl-input-row">
              <input
                type="url"
                placeholder="Paste video URL here… (YouTube, TikTok, Instagram…)"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="text-input"
                onKeyDown={e => e.key === 'Enter' && download()}
              />
              <button onClick={download} disabled={loading} className="btn-primary">
                {loading ? 'Processing…' : 'Download'}
              </button>
            </div>

            {error && <div className="error-box" style={{ marginTop: '1rem' }}>{error}</div>}

            {result && (
              <div className="result-panel">
                {result.thumbnail && (
                  <img src={result.thumbnail} alt="Video thumbnail" className="thumb" />
                )}
                <div className="result-info">
                  {result.title && <h3 className="result-title">{result.title}</h3>}
                  <div className="result-meta">
                    {result.quality && <span className="badge">📺 {result.quality}</span>}
                    {result.size && <span className="badge">💾 {result.size}</span>}
                  </div>
                  <a href={result.download_url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ width: 'fit-content', marginTop: '1rem' }}>
                    ⬇ Download Video
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="platforms">
            <p className="section-label" style={{ marginBottom: '1.5rem' }}>Supported Platforms</p>
            <div className="platform-grid">
              {['YouTube', 'TikTok', 'Instagram', 'Facebook', 'Twitter / X', 'Snapchat', 'Pinterest', 'Dailymotion'].map(p => (
                <div key={p} className="platform-chip glass-card">{p}</div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
