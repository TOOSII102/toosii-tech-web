'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import '../tools.css'

export default function StoryGenerator() {
  const [topic, setTopic]   = useState('')
  const [story, setStory]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [copied, setCopied] = useState(false)

  const generate = async () => {
    const q = topic.trim()
    if (!q) return setError('Please enter a story topic or idea')

    setLoading(true); setError(''); setStory('')
    try {
      const res = await fetch('/api/tools/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: q }),
      })
      const data = await res.json()
      if (!res.ok || data.error) return setError(data.error || 'Generation failed.')
      setStory(data.story)
    } catch {
      setError('Network error — please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    if (!story) return
    navigator.clipboard.writeText(story).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Layout>
      <section className="tool-hero">
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>📖</span> Story Generator</div>
          <h1 className="section-title">AI Story Generator</h1>
          <p className="section-sub">Enter any topic or idea — get a full creative story in seconds, powered by AI.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="tool-card glass-card">
            <textarea
              className="tool-textarea"
              placeholder="Enter a topic or idea (e.g. A boy who discovers he can talk to animals…)"
              value={topic}
              onChange={e => { setTopic(e.target.value); setError('') }}
              disabled={loading}
              style={{ marginBottom: '0.75rem' }}
            />
            <button onClick={generate} disabled={loading} className="btn-primary" style={{ width: '100%' }}>
              {loading ? 'Generating story…' : '✨ Generate Story'}
            </button>

            {loading && (
              <div className="progress-box">
                <div className="spinner" />
                <span>Writing your story…</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748b' }}>may take 10–20s</span>
              </div>
            )}

            {error && <div className="error-box">{error}</div>}

            {story && (
              <div className="tool-output">
                <div className="tool-output-header">
                  <span style={{ fontWeight: 700, color: 'white' }}>📖 Your Story</span>
                  <button onClick={copy} className="copy-btn">
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
                {story}
              </div>
            )}
          </div>

          <div className="tips-grid">
            {[
              { icon: '✨', title: 'Any Topic',      desc: 'From romance to sci-fi — any idea becomes a story.' },
              { icon: '⚡', title: 'Instant Results', desc: 'Full story generated in under 20 seconds.' },
              { icon: '📋', title: 'Copy & Share',   desc: 'One-click copy to use your story anywhere.' },
              { icon: '🔒', title: 'No Sign-up',     desc: 'No account needed. Generate as many as you want.' },
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
