'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import '../tools.css'

export default function FancyTextTool() {
  const [text, setText]     = useState('Toosii')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [styles, setStyles]   = useState(null)
  const [copied, setCopied]   = useState(null)

  const generate = async () => {
    const value = text.trim()
    if (!value) return setError('Type some text to restyle first.')
    setLoading(true); setError(''); setStyles(null)
    try {
      const res = await fetch(`/api/tools/fancytext/styles?q=${encodeURIComponent(value)}`)
      const data = await res.json()
      if (!res.ok) {
        const message = data?.error?.message || 'Fancy text is unavailable right now.'
        return setError(typeof message === 'string' ? message : 'Fancy text is unavailable right now.')
      }
      setStyles(data.styles || [])
    } catch {
      setError('Network error — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const copy = async (value, index) => {
    try { await navigator.clipboard.writeText(value) } catch { /* ignore */ }
    setCopied(index)
    setTimeout(() => setCopied(null), 1400)
  }

  return (
    <Layout>
      <section className="tool-hero">
        <div className="page-wrapper">
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.45rem 1rem', borderRadius: '999px', border: '1px solid rgba(168,85,247,.35)', background: 'rgba(168,85,247,.08)', color: '#c4b5fd', fontSize: '.8rem', fontWeight: 700 }}>
              ✨ Fancy Text
            </span>
          </div>
          <h1 className="section-title">Make your name <span className="gradient-text">pop.</span></h1>
          <p className="section-sub">
            Turn plain text into bold, cursive, gothic, circled or inverted styles — ready to paste into WhatsApp status, Instagram bios, TikTok and game names. Free, unlimited.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="tool-card glass-card">
            <div className="dl-search-wrapper">
              <span className="dl-search-icon">✨</span>
              <input
                type="text"
                placeholder="Type your name or a phrase…"
                value={text}
                maxLength={60}
                onChange={e => { setText(e.target.value); setError('') }}
                className="dl-search-input"
                onKeyDown={e => e.key === 'Enter' && !loading && generate()}
                disabled={loading}
              />
              <button onClick={generate} disabled={loading} className="dl-search-btn">
                {loading ? 'Styling…' : '✨ Make It Fancy'}
              </button>
            </div>

            {error && <p className="tool-error">{error}</p>}

            {loading && (
              <div style={{ textAlign: 'center', padding: '2rem 0 1rem', color: '#94a3b8' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
                <p style={{ margin: '.75rem 0 0', fontSize: '.9rem' }}>Applying styles…</p>
              </div>
            )}

            {styles && (
              <div className="essentials-grid">
                {styles.map(style => (
                  <div className="essentials-cell" key={style.index}>
                    <div className="cell-label">{style.name}</div>
                    <div className="cell-value">{style.result}</div>
                    <button
                      onClick={() => copy(style.result, style.index)}
                      className="btn-outline"
                      style={{ alignSelf: 'flex-start', fontSize: '.72rem', padding: '.25rem .7rem' }}
                    >
                      {copied === style.index ? '✓ Copied' : '📋 Copy'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="tool-card glass-card">
            <h3 style={{ margin: '0 0 1rem', color: '#4ade80' }}>Where it works</h3>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#ccc', lineHeight: 2 }}>
              <li>WhatsApp status and bio — bold, script and gothic styles land perfectly.</li>
              <li>Instagram / TikTok bios and captions.</li>
              <li>Game names in games that allow custom Unicode names.</li>
            </ul>
            <p style={{ margin: '1rem 0 0', color: '#666', fontSize: '.8rem' }}>
              Made by Toosii Tech · Powered by the Partner API
            </p>
          </div>
        </div>
      </section>
    </Layout>
  )
}
