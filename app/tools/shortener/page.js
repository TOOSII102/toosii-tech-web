'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import '../tools.css'

const SERVICES = [
  { id: 'tinyurl', label: 'TinyURL' },
  { id: 'vgd', label: 'vgd.to' },
  { id: 'random', label: 'Random' },
  { id: 'dagd', label: 'dagd' },
]

export default function ShortenerTool() {
  const [url, setUrl]       = useState('')
  const [service, setService] = useState('tinyurl')
  const [alias, setAlias]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [result, setResult]   = useState(null)
  const [copied, setCopied]   = useState(false)

  const shorten = async () => {
    const value = url.trim()
    if (!value) return setError('Paste a link to shorten first.')
    setLoading(true); setError(''); setResult(null); setCopied(false)
    try {
      const params = new URLSearchParams({ url: value, service })
      if (alias.trim()) params.set('alias', alias.trim())
      const res = await fetch(`/api/tools/shorten?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) {
        const message = data?.error?.message || data?.error || 'Shortening failed. Try another service.'
        return setError(typeof message === 'string' ? message : 'Shortening failed. Try another service.')
      }
      setResult(data)
    } catch {
      setError('Network error — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text) } catch { /* ignore */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <Layout>
      <section className="tool-hero">
        <div className="page-wrapper">
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.45rem 1rem', borderRadius: '999px', border: '1px solid rgba(37,211,102,.35)', background: 'rgba(37,211,102,.08)', color: '#72f0ba', fontSize: '.8rem', fontWeight: 700 }}>
              🔗 URL Shortener
            </span>
          </div>
          <h1 className="section-title">Long links, <span className="gradient-text">cut down.</span></h1>
          <p className="section-sub">
            Paste any link and get a short one back in seconds — TinyURL, vgd and more, with custom aliases when you want to control the ending. Free, no account.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="tool-card glass-card">
            <div className="essentials-form-row">
              <div className="dl-search-wrapper">
                <span className="dl-search-icon">🔗</span>
                <input
                  type="url"
                  placeholder="https://example.com/a/very/long/link/…"
                  value={url}
                  onChange={e => { setUrl(e.target.value); setError('') }}
                  className="dl-search-input"
                  onKeyDown={e => e.key === 'Enter' && !loading && shorten()}
                  disabled={loading}
                />
              </div>
              <select value={service} onChange={e => setService(e.target.value)} className="tool-select" disabled={loading} aria-label="Shortener service">
                {SERVICES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            {service !== 'tinyurl' && (
              <div style={{ marginTop: '.75rem' }}>
                <input
                  type="text"
                  placeholder="Custom alias (optional) — e.g. toosii-karibu"
                  value={alias}
                  maxLength={40}
                  onChange={e => setAlias(e.target.value)}
                  className="dl-search-input"
                  style={{ width: '100%', height: '48px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, outline: 'none', padding: '0 1rem' }}
                  disabled={loading}
                />
              </div>
            )}
            <button onClick={shorten} disabled={loading} className="dl-search-btn" style={{ width: '100%', marginTop: '.75rem' }}>
              {loading ? 'Shortening…' : '⚡ Shorten Link'}
            </button>

            {error && <p className="tool-error">{error}</p>}

            {result && (
              <div className="essentials-result-box">
                <div style={{ fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b', fontWeight: 700, marginBottom: '.5rem' }}>
                  Your short link ({result.service})
                </div>
                <a className="big-link" href={result.shortened} target="_blank" rel="noreferrer">{result.shortened}</a>
                <div style={{ display: 'flex', gap: '.6rem', marginTop: '.9rem', flexWrap: 'wrap' }}>
                  <button className="btn-outline" style={{ fontSize: '.8rem', padding: '.4rem .9rem' }} onClick={() => copy(result.shortened)}>
                    {copied ? '✓ Copied' : '📋 Copy Link'}
                  </button>
                  <a className="btn-outline" style={{ fontSize: '.8rem', padding: '.4rem .9rem', textDecoration: 'none' }} href={result.shortened} target="_blank" rel="noreferrer">
                    ↗ Open
                  </a>
                </div>
                {result.info && <p className="essentials-mut">{result.info}</p>}
              </div>
            )}
          </div>

          <div className="tool-card glass-card">
            <h3 style={{ margin: '0 0 1rem', color: '#4ade80' }}>How it works</h3>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#ccc', lineHeight: 2 }}>
              <li>Paste any public link and pick a shortener service.</li>
              <li>With vgd, dagd or Random you can add a <strong>custom alias</strong> so the link reads the way you want.</li>
              <li>Copy the short link and share it anywhere — WhatsApp, SMS, Twitter/X.</li>
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
