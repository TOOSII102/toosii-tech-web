'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import '../tools.css'

const LANGUAGES = [
  { code: 'sw', label: 'Swahili' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'hi', label: 'Hindi' },
  { code: 'am', label: 'Amharic' },
  { code: 'so', label: 'Somali' },
  { code: 'rw', label: 'Kinyarwanda' },
  { code: 'tr', label: 'Turkish' },
  { code: 'ru', label: 'Russian' },
]

export default function TranslateTool() {
  const [text, setText]     = useState('')
  const [to, setTo]         = useState('sw')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [result, setResult]   = useState(null)
  const [copied, setCopied]   = useState(false)

  const translate = async () => {
    const value = text.trim()
    if (!value) return setError('Type something to translate first.')
    setLoading(true); setError(''); setResult(null); setCopied(false)
    try {
      const res = await fetch(`/api/tools/translate?text=${encodeURIComponent(value)}&to=${encodeURIComponent(to)}`)
      const data = await res.json()
      if (!res.ok) {
        const message = data?.error?.message || 'Translation is unavailable right now.'
        return setError(typeof message === 'string' ? message : 'Translation is unavailable right now.')
      }
      setResult(data)
    } catch {
      setError('Network error — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const copy = async (value) => {
    try { await navigator.clipboard.writeText(value) } catch { /* ignore */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const targetLabel = LANGUAGES.find(l => l.code === to)?.label || to

  return (
    <Layout>
      <section className="tool-hero">
        <div className="page-wrapper">
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.45rem 1rem', borderRadius: '999px', border: '1px solid rgba(59,130,246,.35)', background: 'rgba(59,130,246,.08)', color: '#7dd3fc', fontSize: '.8rem', fontWeight: 700 }}>
              🌍 Translator
            </span>
          </div>
          <h1 className="section-title">Say it in <span className="gradient-text">any language.</span></h1>
          <p className="section-sub">
            Translate between English, Swahili and 100+ more languages in one tap. Business messages, songs, names, notes — paste it and go. Free, no account.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="tool-card glass-card">
            <textarea
              className="tool-textarea"
              placeholder="Type or paste the text to translate… (Karibu sana!)"
              value={text}
              maxLength={5000}
              rows={5}
              onChange={e => { setText(e.target.value); setError('') }}
              disabled={loading}
            />
            <div className="essentials-form-row" style={{ marginTop: '.9rem' }}>
              <select value={to} onChange={e => setTo(e.target.value)} className="tool-select" disabled={loading} aria-label="Translate to language">
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>Translate to {l.label}</option>)}
              </select>
              <button onClick={translate} disabled={loading} className="dl-search-btn" style={{ flex: '2 1 180px' }}>
                {loading ? 'Translating…' : `🌍 Translate to ${targetLabel}`}
              </button>
            </div>
            <p style={{ margin: '.6rem 0 0', color: '#64748b', fontSize: '.78rem' }}>
              Any ISO code works too — pick English, type a language, send.
            </p>

            {error && <p className="tool-error">{error}</p>}

            {result && (
              <div className="essentials-result-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b', fontWeight: 700 }}>
                    {targetLabel}
                  </div>
                  <button className="btn-outline" style={{ fontSize: '.8rem', padding: '.4rem .9rem' }} onClick={() => copy(result.translatedText)}>
                    {copied ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>
                <p style={{ margin: '.8rem 0 0', color: '#f1f5f9', fontSize: '1.05rem', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {result.translatedText}
                </p>
                <p className="essentials-mut" style={{ marginTop: '.8rem' }}>
                  Original: <span style={{ color: '#94a3b8' }}>{result.originalText.slice(0, 120)}{result.originalText.length > 120 ? '…' : ''}</span>
                </p>
              </div>
            )}
          </div>

          <div className="tool-card glass-card">
            <h3 style={{ margin: '0 0 1rem', color: '#4ade80' }}>Tips</h3>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#ccc', lineHeight: 2 }}>
              <li>English → Swahili is the most-used pair — it is the default target.</li>
              <li>Keep paragraphs short for the most natural results.</li>
              <li>Use <strong>Copy</strong> to paste straight into WhatsApp or email.</li>
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
