'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import './audio.css'

const STEPS = ['Fetching video info…', 'Extracting audio stream…', 'Almost done…']

export default function AudioDownloader() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')

  const download = async () => {
    if (!url.trim()) return setError('Paste a YouTube URL first')
    setLoading(true); setError(''); setResult(null); setStep(0)

    const stepTimer = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 4000)

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
        setError(data.error || 'Could not extract audio. Try a different YouTube URL.')
      }
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
                onChange={e => { setUrl(e.target.value); setError('') }}
                className="text-input"
                onKeyDown={e => e.key === 'Enter' && !loading && download()}
                disabled={loading}
              />
              <button onClick={download} disabled={loading} className="btn-primary">
                {loading ? 'Processing…' : 'Get MP3'}
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
                  {result.title && <h3 className="result-title">{result.title}</h3>}
                  {result.author && <p className="result-author">by {result.author}</p>}
                  <div className="result-meta">
                    <span className="badge">🎵 MP3</span>
                    {result.duration && <span className="badge">⏱ {result.duration}</span>}
                  </div>
                  <p className="expire-note">⚡ Download now — this link expires in a few minutes</p>
                  <a
                    href={result.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
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
              { icon: '⚡', title: 'Fast Processing', desc: 'Most downloads ready in under 10 seconds.' },
              { icon: '🎵', title: 'High Quality', desc: 'Best available audio bitrate, clear and clean.' },
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
