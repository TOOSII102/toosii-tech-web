'use client'
import Layout from '../../../components/Layout'
import { useState, useRef } from 'react'
import '../tools.css'

export default function FireLogo() {
  const [text, setText]         = useState('')
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [dlLoading, setDlLoad]  = useState(false)
  const [error, setError]       = useState('')

  const downloadImage = async (url, filename) => {
    setDlLoad(true)
    try {
      const res  = await fetch(`/api/download/proxy?url=${encodeURIComponent(url)}&name=${encodeURIComponent(filename)}`)
      const blob = await res.blob()
      const a    = document.createElement('a')
      a.href     = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      alert('Download failed — try right-clicking the image and saving it.')
    } finally {
      setDlLoad(false)
    }
  }

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

  return (
    <Layout>
      <section className="tool-hero">
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>🔥</span> Fire Logo</div>
          <h1 className="section-title">Fire Logo Generator</h1>
          <p className="section-sub">
            Turn any text into a stunning fire-style logo. Perfect for usernames, brands, and social media — generated in seconds.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="tool-card glass-card">
            <div className="tool-input-row">
              <input
                type="text"
                placeholder="Enter your text (max 20 chars)…"
                value={text}
                maxLength={20}
                onChange={e => { setText(e.target.value); setError('') }}
                className="text-input"
                onKeyDown={e => e.key === 'Enter' && !loading && generate()}
                disabled={loading}
              />
              <button onClick={generate} disabled={loading} className="btn-primary">
                {loading ? 'Generating…' : '🔥 Generate'}
              </button>
            </div>
            <p style={{ margin: '.5rem 0 0', color: '#666', fontSize: '.8rem' }}>
              {text.length}/20 characters
            </p>
            {error && <p className="tool-error">{error}</p>}
          </div>

          {result && (
            <div className="tool-card glass-card" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: '#aaa', marginBottom: '1rem', fontSize: '.9rem' }}>
                Your fire logo for: <strong style={{ color: '#25d366' }}>{result.text}</strong>
              </p>
              <img
                src={result.image}
                alt={`Fire logo: ${result.text}`}
                style={{ maxWidth: '100%', borderRadius: 12, border: '1px solid #333' }}
              />
              <div style={{ marginTop: '1.2rem' }}>
                <button
                  onClick={() => downloadImage(result.image, `firelogo-${result.text}.png`)}
                  disabled={dlLoading}
                  className="btn-primary"
                >
                  {dlLoading ? '⏳ Downloading…' : '⬇️ Download Logo'}
                </button>
              </div>
            </div>
          )}

          <div className="tool-card glass-card" style={{ marginTop: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#25d366' }}>Tips for best results</h3>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#ccc', lineHeight: 2 }}>
              <li>Keep text short — 1 to 10 characters looks best.</li>
              <li>Use ALL CAPS for a bolder, more impactful look.</li>
              <li>Right-click or long-press the image to save it.</li>
              <li>Great for WhatsApp display names, gaming tags, and banners.</li>
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
