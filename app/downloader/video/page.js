'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import './video.css'

const STEPS = ['Detecting platform…', 'Fetching video info…', 'Preparing download…']

const PLATFORM_LABELS = {
  youtube: '▶ YouTube',
  tiktok: '♪ TikTok',
  instagram: '📷 Instagram',
  facebook: '👤 Facebook',
  twitter: '✕ Twitter / X',
}

export default function VideoDownloader() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')

  const download = async () => {
    if (!url.trim()) return setError('Paste a video URL first')
    setLoading(true); setError(''); setResult(null); setStep(0)
    const stepTimer = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 4000)
    try {
      const res = await fetch('/api/download/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })
      const data = await res.json()
      if (data.download_url) setResult(data)
      else setError(data.error || 'Could not fetch video. Try a different URL.')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      clearInterval(stepTimer)
      setLoading(false)
    }
  }

  return (
    <Layout>
      <section className="dl-hero">
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>🎬</span> Video Downloader</div>
          <h1 className="section-title">Download Videos in HD</h1>
          <p className="section-sub">YouTube, TikTok, Instagram, Facebook, Twitter and more. Paste any link and download instantly.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="dl-card glass-card">
            <div className="dl-input-row">
              <input
                type="url"
                placeholder="Paste video URL here… (YouTube, TikTok, Instagram, Facebook, Twitter…)"
                value={url}
                onChange={e => { setUrl(e.target.value); setError('') }}
                className="text-input"
                onKeyDown={e => e.key === 'Enter' && !loading && download()}
                disabled={loading}
              />
              <button onClick={download} disabled={loading} className="btn-primary">
                {loading ? 'Processing…' : 'Download'}
              </button>
            </div>

            {loading && (
              <div className="progress-box">
                <div className="spinner" />
                <span>{STEPS[step]}</span>
              </div>
            )}

            {error && <div className="error-box" style={{ marginTop: '1rem' }}>{error}</div>}

            {result && (
              <div className="result-panel">
                {result.thumbnail && (
                  <img src={result.thumbnail} alt="Thumbnail" className="thumb" />
                )}
                <div className="result-info">
                  {result.platform && (
                    <span className="platform-tag">{PLATFORM_LABELS[result.platform] || result.platform}</span>
                  )}
                  {result.title && <h3 className="result-title">{result.title}</h3>}
                  {result.author && <p className="result-author">by {result.author}</p>}
                  <div className="result-meta">
                    {result.quality && <span className="badge">📺 {result.quality}</span>}
                    {result.duration && <span className="badge">⏱ {result.duration}</span>}
                    {result.size && <span className="badge">💾 {result.size}</span>}
                  </div>
                  <p className="expire-note">⚡ Download now — this link expires soon</p>
                  <div className="dl-buttons">
                    <a
                      href={result.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                      style={{ width: 'fit-content' }}
                    >
                      ⬇ Download {result.quality || 'HD'}
                    </a>
                    {result.download_url_sd && (
                      <a
                        href={result.download_url_sd}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                        style={{ width: 'fit-content' }}
                      >
                        ⬇ Download SD
                      </a>
                    )}
                  </div>
                  {result.all_qualities?.length > 1 && (
                    <div className="quality-list">
                      <p className="quality-label">All qualities:</p>
                      {result.all_qualities.map((q, i) => (
                        <a
                          key={i}
                          href={q.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="quality-chip"
                        >
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
