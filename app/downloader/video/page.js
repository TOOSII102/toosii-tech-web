'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import './video.css'

const GT  = 'https://api.giftedtech.co.ke/api/download'
const KEY = 'gifted'

const STEPS = ['Detecting platform…', 'Fetching video info…', 'Preparing download…']

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

async function fetchGT(path) {
  const res = await fetch(`${GT}/${path}`)
  return res.json()
}

async function getVideoData(url) {
  const enc      = encodeURIComponent(url)
  const platform = detect(url)

  if (platform === 'youtube') {
    const d = await fetchGT(`ytv?apikey=${KEY}&url=${enc}`)
    if (d.success && d.result?.download_url) {
      return { platform, download_url: d.result.download_url, title: d.result.title, thumbnail: d.result.thumbnail, quality: d.result.quality, duration: d.result.duration }
    }
  }

  if (platform === 'tiktok') {
    const d = await fetchGT(`tiktok?apikey=${KEY}&url=${enc}`)
    if (d.success && d.result?.video) {
      return { platform, download_url: d.result.video, title: d.result.title, thumbnail: d.result.cover, author: d.result.author?.name, duration: d.result.duration ? `${d.result.duration}s` : null }
    }
  }

  if (platform === 'instagram') {
    const d = await fetchGT(`instadl?apikey=${KEY}&url=${enc}`)
    if (d.success && d.result?.download_url) {
      return { platform, download_url: d.result.download_url, thumbnail: d.result.thumbnail, title: 'Instagram Reel' }
    }
  }

  if (platform === 'facebook') {
    const d = await fetchGT(`facebook?apikey=${KEY}&url=${enc}`)
    if (d.success && (d.result?.hd_video || d.result?.sd_video)) {
      return { platform, download_url: d.result.hd_video || d.result.sd_video, download_url_sd: d.result.sd_video || null, title: d.result.title, thumbnail: d.result.thumbnail, duration: d.result.duration, quality: d.result.hd_video ? 'HD' : 'SD' }
    }
  }

  if (platform === 'twitter') {
    const d = await fetchGT(`twitter?apikey=${KEY}&url=${enc}`)
    if (d.success && d.result?.videoUrls?.length) {
      const sorted = [...d.result.videoUrls].sort((a, b) => (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0))
      return { platform, download_url: sorted[0].url, thumbnail: d.result.thumbnail, quality: sorted[0].quality, title: 'Twitter / X Video', all_qualities: sorted }
    }
  }

  const msg = platform
    ? `Could not download from ${platform}. Check the link and try again.`
    : 'Unsupported URL. Paste a YouTube, TikTok, Instagram, Facebook or Twitter link.'
  throw new Error(msg)
}

export default function VideoDownloader() {
  const [url, setUrl]       = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep]     = useState(0)
  const [error, setError]   = useState('')

  const download = async () => {
    const trimmed = url.trim()
    if (!trimmed) return setError('Paste a video URL first')

    setLoading(true); setError(''); setResult(null); setStep(0)
    const timer = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 4000)

    try {
      const data = await getVideoData(trimmed)
      setResult(data)
    } catch (e) {
      setError(e.message || 'Could not fetch video. Try a different URL.')
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
                    {result.quality   && <span className="badge">📺 {result.quality}</span>}
                    {result.duration  && <span className="badge">⏱ {result.duration}</span>}
                    {result.size      && <span className="badge">💾 {result.size}</span>}
                  </div>
                  <p className="expire-note">⚡ Download now — this link expires in a few minutes</p>
                  <div className="dl-buttons">
                    <a href={result.download_url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ width: 'fit-content' }}>
                      ⬇ Download {result.quality || 'HD'}
                    </a>
                    {result.download_url_sd && (
                      <a href={result.download_url_sd} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ width: 'fit-content' }}>
                        ⬇ Download SD
                      </a>
                    )}
                  </div>
                  {result.all_qualities?.length > 1 && (
                    <div className="quality-list">
                      <p className="quality-label">All qualities:</p>
                      {result.all_qualities.map((q, i) => (
                        <a key={i} href={q.url} target="_blank" rel="noopener noreferrer" className="quality-chip">
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
