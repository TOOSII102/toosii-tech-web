'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import '../tools.css'

const SIZES = [
  { label: 'Square',    width: 1024, height: 1024, icon: '◼️' },
  { label: 'Portrait',  width: 768,  height: 1152, icon: '📱' },
  { label: 'Landscape', width: 1280, height: 720,  icon: '🖥️' },
]

const IDEAS = [
  'A lion resting on a Nairobi rooftop at sunset, cinematic',
  'A futuristic African city skyline at night, neon lights',
  'A portrait of a Maasai warrior in digital art style',
  'A cozy coffee shop in the rain, warm lighting, anime style',
  'Mount Kenya covered in snow, golden hour, ultra realistic',
  'A gaming logo of a green cobra, dark background',
]

export default function Imagine() {
  const [prompt, setPrompt]   = useState('')
  const [size, setSize]       = useState(SIZES[0])
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [dlDone, setDlDone]   = useState(false)

  const generate = async (overridePrompt) => {
    const p = (typeof overridePrompt === 'string' ? overridePrompt : prompt).trim()
    if (!p) return setError('Describe the image you want first.')
    setLoading(true); setError(''); setResult(null); setDlDone(false)
    try {
      const res = await fetch('/api/tools/imagine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p, width: size.width, height: size.height }),
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

  const download = () => {
    if (!result?.image) return
    const a = document.createElement('a')
    a.href = result.image
    a.download = `toosii-imagine-${Date.now()}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setDlDone(true)
    setTimeout(() => setDlDone(false), 1500)
  }

  return (
    <Layout>
      <section className="tool-hero">
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>🎨</span> AI Image Generator</div>
          <h1 className="section-title">Type it. <span className="gradient-text">See it.</span></h1>
          <p className="section-sub">
            Describe anything — people, places, logos, art styles — and get a unique AI-generated image in seconds. Up to HD quality, no sign-up, no watermark, free forever.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">

          <div className="tool-card glass-card">
            <div className="dl-search-wrapper">
              <span className="dl-search-icon">🎨</span>
              <input
                type="text"
                placeholder="Describe your image… e.g. a lion on a Nairobi rooftop at sunset"
                value={prompt}
                maxLength={500}
                onChange={e => { setPrompt(e.target.value); setError('') }}
                className="dl-search-input"
                onKeyDown={e => e.key === 'Enter' && !loading && generate()}
                disabled={loading}
              />
              <button onClick={() => generate()} disabled={loading} className="dl-search-btn">
                {loading ? '🎨 Creating…' : '✨ Generate'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '.5rem', marginTop: '.85rem', flexWrap: 'wrap' }}>
              {SIZES.map(s => (
                <button
                  key={s.label}
                  onClick={() => setSize(s)}
                  disabled={loading}
                  className="btn-outline"
                  style={{
                    fontSize: '.78rem', padding: '.35rem .8rem',
                    ...(size.label === s.label ? { borderColor: '#8b5cf6', color: '#c4b5fd', background: 'rgba(139,92,246,.12)' } : {}),
                  }}
                >
                  {s.icon} {s.label} · {s.width}×{s.height}
                </button>
              ))}
            </div>
            {error && <p className="tool-error">{error}</p>}
          </div>

          {!result && !loading && (
            <div className="tool-card glass-card" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem', color: '#c4b5fd' }}>💡 Try one of these</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
                {IDEAS.map(idea => (
                  <button
                    key={idea}
                    onClick={() => { setPrompt(idea); generate(idea) }}
                    className="btn-outline"
                    style={{ textAlign: 'left', fontSize: '.85rem', padding: '.6rem .9rem', color: '#d1d5db' }}
                  >
                    ✨ {idea}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="tool-card glass-card" style={{ marginTop: '1.5rem', textAlign: 'center', padding: '3rem 1.5rem' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: '.8rem', animation: 'pulse 1.4s ease-in-out infinite' }}>🎨</div>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '.95rem' }}>Painting your image — this takes about 5–15 seconds…</p>
            </div>
          )}

          {result && (
            <div className="tool-card glass-card" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: '#94a3b8', marginBottom: '1rem', fontSize: '.9rem' }}>
                <strong style={{ color: '#c4b5fd' }}>{result.prompt}</strong>
              </p>
              <img
                src={result.image}
                alt={`AI generated: ${result.prompt}`}
                style={{ maxWidth: '100%', maxHeight: 480, borderRadius: 14, border: '1px solid #26262e', boxShadow: '0 18px 50px rgba(0,0,0,.45)' }}
              />
              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', marginTop: '1.4rem', flexWrap: 'wrap' }}>
                <button onClick={download} className="btn-primary" style={{ background: '#8b5cf6' }}>
                  {dlDone ? '✅ Saved' : '⬇️ Download Image'}
                </button>
                <button onClick={() => generate()} disabled={loading} className="btn-outline">
                  🔁 New Version
                </button>
              </div>
            </div>
          )}

          <div className="tool-card glass-card" style={{ marginTop: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#c4b5fd' }}>Tips for great images</h3>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#ccc', lineHeight: 2 }}>
              <li>Be specific: subject + setting + style (e.g. “cinematic”, “anime”, “ultra realistic”).</li>
              <li>Mention lighting for mood: “golden hour”, “neon lights”, “soft studio light”.</li>
              <li>Use <strong>Portrait</strong> for people, <strong>Landscape</strong> for scenes, <strong>Square</strong> for profiles and logos.</li>
              <li>Click <strong>New Version</strong> to re-roll the same idea — every image is unique.</li>
            </ul>
            <p style={{ margin: '1rem 0 0', color: '#666', fontSize: '.8rem' }}>
              _Made by Toosii Tech · Free AI image generation_
            </p>
          </div>

        </div>
      </section>
    </Layout>
  )
}
