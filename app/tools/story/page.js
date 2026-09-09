'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import '../tools.css'

const IDEAS = [
  'A Nairobi matatu driver who finds a mysterious phone',
  'A young inventor from Kibera who builds a robot from scrap',
  'A fisherman on Lake Victoria who catches something impossible',
  'Two rivals forced to share a boda boda during a city blackout',
  'A grandmother with a secret recipe that heals heartbreak',
]

function splitStory(raw) {
  const text = String(raw || '').trim()
  if (!text) return { title: null, body: '' }
  const parts = text.split(/\n\s*\n/)
  if (parts.length > 1 && parts[0].replace(/\n/g, ' ').trim().length <= 90) {
    return { title: parts[0].replace(/\n/g, ' ').trim(), body: parts.slice(1).join('\n\n').trim() }
  }
  return { title: null, body: text }
}

export default function StoryGenerator() {
  const [topic, setTopic]     = useState('')
  const [result, setResult]   = useState(null) // { title, body, words }
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [copied, setCopied]   = useState(false)

  const generate = async (override) => {
    const q = (typeof override === 'string' ? override : topic).trim()
    if (!q) return setError('Please enter a story topic or idea.')
    setLoading(true); setError(''); setResult(null); setCopied(false)
    try {
      const res = await fetch('/api/tools/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: q }),
      })
      const data = await res.json()
      if (!res.ok || data.error) return setError(data.error || 'Generation failed. Try again.')
      const { title, body } = splitStory(data.story)
      setResult({ title, body, words: body.split(/\s+/).filter(Boolean).length })
    } catch {
      setError('Network error — please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    if (!result) return
    const text = result.title ? `${result.title}\n\n${result.body}` : result.body
    try { await navigator.clipboard.writeText(text) } catch {
      const el = Object.assign(document.createElement('textarea'), { value: text, style: 'position:fixed;opacity:0' })
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Layout>
      <section className="tool-hero">
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>📖</span> Story Generator</div>
          <h1 className="section-title">Your Idea. <span className="gradient-text">A Full Story.</span></h1>
          <p className="section-sub">Type any topic, genre, or prompt and get a complete, ready-to-share creative story in seconds — powered by AI, written for humans.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="tool-card glass-card">
            <textarea
              className="tool-textarea"
              placeholder="Enter a topic or idea (e.g. A boy who discovers he can talk to animals…)"
              value={topic}
              maxLength={300}
              onChange={e => { setTopic(e.target.value); setError('') }}
              disabled={loading}
              style={{ marginBottom: '0.75rem' }}
            />
            <button onClick={() => generate()} disabled={loading} className="btn-primary" style={{ width: '100%' }}>
              {loading ? '✍️ Writing your story…' : '✨ Generate Story'}
            </button>

            {!result && !loading && (
              <div style={{ display: 'flex', gap: '.5rem', marginTop: '.9rem', flexWrap: 'wrap' }}>
                {IDEAS.map(idea => (
                  <button
                    key={idea}
                    onClick={() => { setTopic(idea); generate(idea) }}
                    className="btn-outline"
                    style={{ fontSize: '.78rem', padding: '.35rem .8rem', color: '#d1d5db' }}
                  >
                    ✨ {idea}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="progress-box">
                <div className="spinner" />
                <span>Writing your story…</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748b' }}>usually 5–15s</span>
              </div>
            )}

            {error && <div className="error-box">{error}</div>}
          </div>

          {result && (
            <div className="tool-card glass-card" style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 700, color: 'white' }}>📖 Your Story</span>
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '.75rem', color: '#64748b' }}>
                    {result.words} words · ~{Math.max(1, Math.round(result.words / 200))} min read
                  </span>
                  <button onClick={() => generate()} disabled={loading} className="copy-btn" title="Write a new version of the same idea">
                    🔁 Re-roll
                  </button>
                  <button onClick={copy} className="copy-btn">{copied ? '✓ Copied!' : 'Copy'}</button>
                </div>
              </div>
              {result.title && (
                <h2 style={{ color: '#4ade80', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 .9rem', lineHeight: 1.35 }}>{result.title}</h2>
              )}
              <div
                className="tool-output"
                style={{ maxHeight: 480, overflowY: 'auto', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '1.1rem 1.2rem', background: 'rgba(255,255,255,.03)', fontSize: '.95rem', lineHeight: 1.85, color: '#d8dee9' }}
              >
                {result.body}
              </div>
            </div>
          )}

          <div className="tips-grid" style={{ marginTop: '2rem' }}>
            {[
              { icon: '✨', title: 'Any Topic',       desc: 'From romance to sci-fi — any idea becomes a story.' },
              { icon: '🌍', title: 'Local Flavour',   desc: 'Set stories in Nairobi, Mombasa, or anywhere you like.' },
              { icon: '📋', title: 'Copy & Share',    desc: 'One-click copy to use your story anywhere.' },
              { icon: '🔒', title: 'No Sign-up',      desc: 'No account needed. Generate as many as you want.' },
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
