'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import '../tools.css'

const SUGGESTIONS = ['John 3:16', 'Psalm 23', 'Philippians 4:13', 'Proverbs 3:5-6', 'Isaiah 40:31', 'Joshua 1:9']

export default function BibleTool() {
  const [q, setQ]           = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [copied, setCopied]   = useState(false)

  const search = async (override) => {
    const query = (typeof override === 'string' ? override : q).trim()
    if (!query) return setError('Type a reference first — e.g. “John 3:16”.')
    setLoading(true); setError(''); setResult(null); setCopied(false)
    try {
      const res = await fetch(`/api/tools/bible?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (!res.ok) {
        const message = data?.error?.message || 'No verses found. Try “john 3:16” or “psalm 23”.'
        return setError(typeof message === 'string' ? message : 'No verses found.')
      }
      setResult(data)
    } catch {
      setError('Network error — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    if (!result) return
    const text = `${result.text} — ${result.reference}` + (result.translation?.name ? ` (${result.translation.name})` : '')
    try { await navigator.clipboard.writeText(text) } catch { /* ignore */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <Layout>
      <section className="tool-hero">
        <div className="page-wrapper">
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.45rem 1rem', borderRadius: '999px', border: '1px solid rgba(251,191,36,.35)', background: 'rgba(251,191,36,.08)', color: '#fde68a', fontSize: '.8rem', fontWeight: 700 }}>
              📖 Bible Search
            </span>
          </div>
          <h1 className="section-title">The Word, <span className="gradient-text">in seconds.</span></h1>
          <p className="section-sub">
            Look up any verse instantly — “John 3:16”, “Psalm 23”, “Philippians 4:13”. Read it here, then share it on WhatsApp with one tap. Free, always.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="tool-card glass-card">
            <div className="dl-search-wrapper">
              <span className="dl-search-icon">📖</span>
              <input
                type="text"
                placeholder="Book chapter:verse — e.g. John 3:16"
                value={q}
                maxLength={80}
                onChange={e => { setQ(e.target.value); setError('') }}
                className="dl-search-input"
                onKeyDown={e => e.key === 'Enter' && !loading && search()}
                disabled={loading}
              />
              <button onClick={() => search()} disabled={loading} className="dl-search-btn">
                {loading ? 'Searching…' : '🔍 Read Verse'}
              </button>
            </div>

            {error && <p className="tool-error">{error}</p>}

            {!result && !loading && (
              <div style={{ display: 'flex', gap: '.5rem', marginTop: '.9rem', flexWrap: 'wrap' }}>
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => { setQ(s); search(s) }}
                    className="btn-outline"
                    style={{ fontSize: '.78rem', padding: '.35rem .8rem', color: '#d1d5db' }}
                  >
                    ✝️ {s}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
                <p style={{ margin: '.75rem 0 0', color: '#94a3b8', fontSize: '.9rem' }}>Finding that verse…</p>
              </div>
            )}

            {result && (
              <div className="essentials-result-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#fde68a', fontSize: '1.15rem' }}>{result.reference}</h3>
                    {result.translation?.name && (
                      <p style={{ margin: '.25rem 0 0', color: '#94a3b8', fontSize: '.78rem' }}>
                        {result.translation.name}{result.translation.note ? ` · ${result.translation.note}` : ''}
                      </p>
                    )}
                  </div>
                  <button onClick={copy} className="btn-outline" style={{ fontSize: '.8rem', padding: '.4rem .9rem' }}>
                    {copied ? '✓ Copied' : '📋 Copy Verse'}
                  </button>
                </div>
                <blockquote style={{
                  margin: '1rem 0 0',
                  padding: '1rem 1.25rem',
                  borderLeft: '3px solid #fbbf24',
                  background: 'rgba(251,191,36,.06)',
                  borderRadius: '0 10px 10px 0',
                  color: '#f1f5f9',
                  fontSize: '1.05rem',
                  lineHeight: 1.9,
                  fontStyle: 'italic',
                }}>
                  {result.text}
                </blockquote>
              </div>
            )}
          </div>

          <div className="tool-card glass-card">
            <h3 style={{ margin: '0 0 1rem', color: '#4ade80' }}>Tips</h3>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#ccc', lineHeight: 2 }}>
              <li>Use the <strong>book chapter:verse</strong> format — “John 3:16”, “Psalm 23:1-4”.</li>
              <li>Verses come from the public-domain World English Bible translation.</li>
              <li>Copy the verse with the reference attached, ready for WhatsApp.</li>
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
