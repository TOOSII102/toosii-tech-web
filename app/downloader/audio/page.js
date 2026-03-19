'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import './audio.css'

const STEPS = ['Fetching video info…', 'Converting to MP3…', 'Almost done…']

export default function AudioDownloader() {
  const [url, setUrl]         = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep]       = useState(0)
  const [error, setError]     = useState('')

  const download = async () => {
    const trimmed = url.trim()
    if (!trimmed) return setError('Paste a YouTube URL first')

    setLoading(true); setError(''); setResult(null); setStep(0)
    const timer = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 8000)

    try {
      const res = await fetch('/api/download/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed })
      })
      const data = await res.json()
      if (data.download_url) setResult(data)
      else setError(data.error || 'Could not extract audio. Try a different YouTube URL.')
    } catch {
      setError('Network error — please try again.')
    } finally {
      clearInterval(timer)
      setLoading(false)
    }
  }

  return (
    <Layout>
      <section className="dl-hero">
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>🎧</span> MP3 Downloader</div>
          <h1 className="section-title">Download Audio in High Quality</h1>
          <p className="section-sub">Extract MP3 audio from any YouTube video. Fast, free, no sign-up required.</p>
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
                {loading ? 'Converting…' : 'Get MP3'}
              </button>
            </div>

            {loading && (
              <div className="progress-box">
                <div className="spinner" />
                <span>{STEPS[step]}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748b' }}>may take 20–40s</span>
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
                  <div className="result-meta">
                    <span className="badge">🎵 MP3</span>
                    {result.quality && <span className="badge">🎚 {result.quality}</span>}
                  </div>
                  <p className="expire-note">⚡ Download now — link expires soon</p>
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
              { icon: '⚡', title: 'No API Key', desc: 'Uses free YouTube conversion — no limits.' },
              { icon: '🎵', title: '128kbps MP3', desc: 'High quality audio, clear and clean.' },
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
