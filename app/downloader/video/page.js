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

const STEPS = ['Detecting platform…', 'Fetching video info…', 'Preparing download link…']

export default function VideoDownloader() {
  const [url, setUrl]         = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep]       = useState(0)
  const [error, setError]     = useState('')

  const download = async () => {
    const trimmed = url.trim()
    if (!trimmed) return setError('Paste a video URL first')

    const platform = detect(trimmed)
    if (!platform) return setError('Unsupported URL. Paste a YouTube, TikTok, Instagram, Facebook or Twitter link.')

    setLoading(true); setError(''); setResult(null); setStep(0)
    const timer = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 6000)

    try {
      const enc = encodeURIComponent(trimmed)

      // ── TikTok: server-side tikwm first, then GiftedTech browser fallback ──
      if (platform === 'tiktok') {
        const res = await fetch('/api/download/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed })
        })
        const data = await res.json()
        if (data.download_url) { setResult(data); return }

        // Browser-direct GiftedTech fallback
        setStep(2)
        try {
          const gtRes = await fetch(`${GT}/tiktok?apikey=gifted&url=${enc}`)
          const gt = await gtRes.json()
          if (gt.success && gt.result?.download_url) {
            setResult({
              platform, download_url: gt.result.download_url,
              title: gt.result.title, thumbnail: gt.result.thumbnail,
              duration: gt.result.duration, author: gt.result.author,
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

      // ── YouTube / Instagram / Facebook / Twitter ──────────────────────────
      // Step 1: try our server API (works from Vercel, may fail on Replit dev)
      setStep(1)
      const serverRes = await fetch('/api/download/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed })
      })
      const serverData = await serverRes.json()
      if (serverData.download_url) { setResult(serverData); return }

      // Step 2: browser-direct GiftedTech (CORS open, user's own IP)
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
          title: d.result.title, thumbnail: d.result.thumbnail,
          quality: d.result.quality, duration: d.result.duration,
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
          duration: d.result.duration, quality: d.result.hd_video ? 'HD' : 'SD',
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

      // All failed
      const msg = d.message || ''
      setError(
        msg.includes('Limit')
          ? 'Download service is temporarily overloaded. Please try again in a few minutes.'
          : `Could not download from ${PLATFORM_LABELS[platform] || platform}. Try again shortly.`
      )
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
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>🎬</span> Video Downloader</div>
          <h1 className="section-title">Download Videos in HD</h1>
          <p className="section-sub">YouTube, TikTok, Instagram, Facebook, Twitter — paste any link and download instantly.</p>
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
