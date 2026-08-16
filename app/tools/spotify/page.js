'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import '../tools.css'

export default function SpotifyDownloader() {
  const [url, setUrl]         = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const download = async () => {
    const u = url.trim()
    if (!u) return setError('Please paste a Spotify track link.')
    if (!/open\.spotify\.com\/track\//i.test(u)) return setError('Only Spotify track links are supported — e.g. https://open.spotify.com/track/...')

    setLoading(true); setError(''); setResult(null)
    try {
      const res  = await fetch('/api/tools/spotify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: u }),
      })
      const data = await res.json()
      if (!res.ok || data.error) return setError(data.error || 'Download failed. Please try again.')
      setResult(data)
    } catch {
      setError('Network error — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <section className="tool-hero">
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>🎵</span> Spotify Downloader</div>
          <h1 className="section-title">Download Spotify Tracks</h1>
          <p className="section-sub">
            Paste any Spotify track link and download the audio as an MP3 — free, fast, and no account needed.
          </p>
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
            {error && <p className="tool-error">{error}</p>}
          </div>

          {result && (
            <div className="tool-card glass-card" style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {result.cover && (
                  <img
                    src={result.cover}
                    alt={result.title}
                    style={{ width: 100, height: 100, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: '0 0 .3rem', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                    {result.title}
                  </h3>
                  <p style={{ margin: '0 0 .2rem', color: '#aaa', fontSize: '.9rem' }}>
                    👤 {result.artist}
                  </p>
                  <p style={{ margin: 0, color: '#888', fontSize: '.85rem' }}>⏱ {result.duration}</p>
                </div>
              </div>
              <a
                href={`/api/download/proxy?url=${encodeURIComponent(result.download)}&name=${encodeURIComponent(
                  `${result.artist ? result.artist + ' - ' : ''}${result.title || 'track'}.mp3`
                    .replace(/[^a-z0-9 _\-().]/gi, '')
                    .trim()
                    .slice(0, 80)
                )}`}
                download
                className="btn-primary"
                style={{ display: 'inline-block', marginTop: '1.2rem', textDecoration: 'none' }}
              >
                ⬇️ Download MP3
              </a>
            </div>
          )}

          <div className="tool-card glass-card" style={{ marginTop: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#25d366' }}>How it works</h3>
            <ol style={{ margin: 0, paddingLeft: '1.2rem', color: '#ccc', lineHeight: 2 }}>
              <li>Open Spotify and find a track you want to download.</li>
              <li>Tap the three dots (···) → <strong>Share</strong> → <strong>Copy Link</strong>.</li>
              <li>Paste the link above and hit <strong>Download</strong>.</li>
              <li>Click <strong>Download MP3</strong> to save the audio to your device.</li>
            </ol>
            <p style={{ margin: '1rem 0 0', color: '#666', fontSize: '.8rem' }}>
              _Made by Toosii Tech · Supports Spotify track links only_
            </p>
          </div>
        </div>
      </section>
    </Layout>
  )
}
