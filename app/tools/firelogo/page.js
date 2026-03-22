'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import '../tools.css'

const SIZES = [
  { label: 'Icon',   width: 64,  height: 64,  desc: '64 × 64 px',   use: 'App icons, favicons' },
  { label: 'Small',  width: 128, height: 128, desc: '128 × 128 px',  use: 'Thumbnails, avatars' },
  { label: 'Medium', width: 256, height: 256, desc: '256 × 256 px',  use: 'Profile pictures' },
  { label: 'Large',  width: 512, height: 512, desc: '512 × 512 px',  use: 'High-res logos' },
  { label: 'Banner', width: 800, height: 400, desc: '800 × 400 px',  use: 'Social media banners' },
]

function resizeAndDownload(imageUrl, width, height, filename) {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width  = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, width, height)
    canvas.toBlob(blob => {
      if (!blob) return alert('Download failed — try right-clicking the image to save it.')
      const a = document.createElement('a')
      a.href     = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    }, 'image/png')
  }
  img.onerror = () => alert('Could not load image for resizing. Try right-clicking to save.')
  img.src = imageUrl
}

export default function FireLogo() {
  const [text, setText]       = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [dlKey, setDlKey]     = useState(null)

  const generate = async () => {
    const t = text.trim()
    if (!t) return setError('Please enter some text to generate a logo.')
    if (t.length > 20) return setError('Text must be 20 characters or less for best results.')

    setLoading(true); setError(''); setResult(null)
    try {
      const res  = await fetch('/api/tools/firelogo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t }),
      })
      const data = await res.json()
      if (!res.ok || data.error) return setError(data.error || 'Generation failed. Try again.')
      setResult(data)
    } catch {
      setError('Network error — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (size) => {
    if (!result?.image) return
    const key = size.label
    setDlKey(key)
    resizeAndDownload(
      result.image,
      size.width,
      size.height,
      `firelogo-${result.text}-${size.label.toLowerCase()}-${size.width}x${size.height}.png`
    )
    setTimeout(() => setDlKey(null), 1500)
  }

  return (
    <Layout>
      <section className="tool-hero">
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>🔥</span> Fire Logo</div>
          <h1 className="section-title">Fire Logo Generator</h1>
          <p className="section-sub">
            Turn any text into a stunning fire-style logo. Download in multiple sizes — perfect for icons, profiles, and social banners.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">

          <div className="tool-card glass-card">
            <div className="dl-search-wrapper">
              <span className="dl-search-icon">🔥</span>
              <input
                type="text"
                placeholder="Enter your text (max 20 chars)…"
                value={text}
                maxLength={20}
                onChange={e => { setText(e.target.value); setError('') }}
                className="dl-search-input"
                onKeyDown={e => e.key === 'Enter' && !loading && generate()}
                disabled={loading}
              />
              <button onClick={generate} disabled={loading} className="dl-search-btn">
                {loading ? 'Generating…' : '🔥 Generate'}
              </button>
            </div>
            <p style={{ margin: '.5rem 0 0', color: '#666', fontSize: '.8rem' }}>
              {text.length}/20 characters
            </p>
            {error && <p className="tool-error">{error}</p>}
          </div>

          {result && (
            <>
              <div className="tool-card glass-card" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <p style={{ color: '#aaa', marginBottom: '1rem', fontSize: '.9rem' }}>
                  Fire logo for: <strong style={{ color: '#25d366' }}>{result.text}</strong>
                </p>
                <img
                  src={result.image}
                  alt={`Fire logo: ${result.text}`}
                  style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 12, border: '1px solid #333' }}
                />
              </div>

              <div className="tool-card glass-card" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.2rem', color: '#25d366' }}>📦 Download by Size</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '1rem',
                }}>
                  {SIZES.map(size => (
                    <div
                      key={size.label}
                      style={{
                        background: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: 12,
                        padding: '1rem',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '.6rem',
                      }}
                    >
                      <img
                        src={result.image}
                        alt={`${size.label} preview`}
                        style={{
                          width:  Math.min(size.width,  96),
                          height: size.label === 'Banner' ? 48 : Math.min(size.height, 96),
                          objectFit: 'cover',
                          borderRadius: 8,
                          border: '1px solid #333',
                        }}
                      />
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: '.95rem' }}>
                          {size.label}
                        </p>
                        <p style={{ margin: '.15rem 0 0', color: '#888', fontSize: '.75rem' }}>
                          {size.desc}
                        </p>
                        <p style={{ margin: '.1rem 0 0', color: '#555', fontSize: '.7rem' }}>
                          {size.use}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownload(size)}
                        disabled={dlKey === size.label}
                        className="btn-primary"
                        style={{ fontSize: '.8rem', padding: '.45rem .9rem', width: '100%' }}
                      >
                        {dlKey === size.label ? '✅ Done' : `⬇️ Download`}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="tool-card glass-card" style={{ marginTop: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#25d366' }}>Tips for best results</h3>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#ccc', lineHeight: 2 }}>
              <li>Keep text short — 1 to 10 characters looks best.</li>
              <li>Use ALL CAPS for a bolder, more impactful look.</li>
              <li>Download the <strong>Icon</strong> size for app icons and favicons.</li>
              <li>Use <strong>Banner</strong> size for YouTube channel art or Twitter headers.</li>
              <li>Great for WhatsApp display names, gaming tags, and profile pictures.</li>
            </ul>
            <p style={{ margin: '1rem 0 0', color: '#666', fontSize: '.8rem' }}>
              _Made by Toosii Tech · Free fire logo generation_
            </p>
          </div>

        </div>
      </section>
    </Layout>
  )
}
