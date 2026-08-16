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

export default function AudioDownloader() {
  const [url, setUrl]         = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep]       = useState(0)
  const [error, setError]     = useState('')

  const download = async () => {
    const trimmed = url.trim()
    if (!trimmed) return setError('Paste a YouTube URL first')
    if (!/youtube\.com|youtu\.be/i.test(trimmed)) return setError('Only YouTube links are supported for MP3 download')

    setLoading(true); setError(''); setResult(null); setStep(0)
    const timer = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 7000)

    try {
      // 1. Try our server-side route (loader.to — works on Vercel)
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

      // 2. Browser-direct fallback: call GiftedTech from user's own IP (CORS open)
      setStep(1)
      const enc = encodeURIComponent(trimmed)
      const gtRes = await fetch(`${GT}/ytmp3?apikey=gifted&url=${enc}`)
      const gtData = await gtRes.json()

      if (gtData.success && gtData.result?.download_url) {
        const d = gtData.result
        setResult({
          download_url: d.download_url,
          title:     d.title,
          thumbnail: d.thumbnail,
          quality:   d.quality || '128kbps',
        })
        clearInterval(timer); setLoading(false)
        return
      }

      // 3. Everything failed
      const msg = gtData.message || 'Could not extract audio. The conversion service is busy — please try again in a few minutes.'
      setError(msg.includes('Limit') ? 'Download service is temporarily overloaded. Please try again in a few minutes.' : msg)

    } catch (e) {
      setError('Network error — please check your connection and try again.')
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
          <p className="section-sub">Extract MP3 audio from any YouTube video. Free, no sign-up required.</p>
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
                {result.thumbnail && <img src={result.thumbnail} alt="Thumbnail" className="thumb" />}
                <div className="result-info">
                  {result.title && <h3 className="result-title">{result.title}</h3>}
                  <div className="result-meta">
                    <span className="badge">🎵 MP3</span>
                    {result.quality && <span className="badge">🎚 {result.quality}</span>}
                  </div>
                  <p className="expire-note">⚡ Download now — link expires soon</p>
                  <a
                    href={proxyUrl(result.download_url, result.title)}
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
              { icon: '⚡', title: 'Fast Conversion', desc: 'Your video converts to MP3 in seconds.' },
              { icon: '🎵', title: '128kbps MP3',    desc: 'High quality audio, clear and clean.' },
              { icon: '🔒', title: 'No Sign-up',     desc: 'No account, no login, no tracking.' },
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
