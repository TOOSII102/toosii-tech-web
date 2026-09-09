'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import '../tools.css'

const SUGGESTIONS = ['Jeje — Diamond Platnumz', 'Soweto — Victony', 'Calm Down — Rema', 'Lala — Willy Paul']

export default function LyricsFinder() {
  const [q, setQ]           = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [copied, setCopied]   = useState(false)

  const search = async (override) => {
    const query = (typeof override === 'string' ? override : q).trim()
    if (!query) return setError('Type a song title or artist first.')
    setLoading(true); setError(''); setResult(null); setCopied(false)
    try {
      const res = await fetch(`/api/tools/lyrics?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (!res.ok || data.error) return setError(data.error || 'No lyrics found. Try adding the artist name.')
      setResult(data)
    } catch {
      setError('Network error — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    if (!result?.lyrics) return
    try { await navigator.clipboard.writeText(result.lyrics) } catch {
      const el = Object.assign(document.createElement('textarea'), { value: result.lyrics, style: 'position:fixed;opacity:0' })
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true); setTimeout(() => setCopied(false), 1600)
  }

  return (
    <Layout>
      <section className="tool-hero">
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>🎵</span> Lyrics Finder</div>
          <h1 className="section-title">Every word, <span className="gradient-text">sing along.</span></h1>
          <p className="section-sub">
            Type any song title or artist and get the full lyrics instantly — Bongo, Afrobeats, Gengetone, gospel and international hits. Free, always.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">

          <div className="tool-card glass-card">
            <div className="dl-search-wrapper">
              <span className="dl-search-icon">🎵</span>
              <input
                type="text"
                placeholder="Song title or artist… e.g. Jeje Diamond Platnumz"
                value={q}
                maxLength={120}
                onChange={e => { setQ(e.target.value); setError('') }}
                className="dl-search-input"
                onKeyDown={e => e.key === 'Enter' && !loading && search()}
                disabled={loading}
              />
              <button onClick={() => search()} disabled={loading} className="dl-search-btn">
                {loading ? 'Searching…' : '🔍 Find Lyrics'}
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
                    🎧 {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading && (
            <div className="tool-card glass-card" style={{ marginTop: '1.5rem', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '.7rem', animation: 'pulse 1.4s ease-in-out infinite' }}>🎵</div>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '.95rem' }}>Finding those lyrics…</p>
            </div>
          )}

          {result && (
            <div className="tool-card glass-card" style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>{result.track}</h2>
                  <p style={{ margin: '.3rem 0 0', color: '#94a3b8', fontSize: '.88rem' }}>
                    {result.artist && <>🎤 {result.artist}</>}
                    {result.album && <span style={{ opacity: .7 }}> · 💿 {result.album}</span>}
                    {result.duration && <span style={{ opacity: .7 }}> · ⏱ {result.duration}</span>}
                  </p>
                </div>
                <button onClick={copy} className="btn-outline" style={{ fontSize: '.8rem', padding: '.4rem .9rem' }}>
                  {copied ? '✓ Copied' : '📋 Copy Lyrics'}
                </button>
              </div>
              <div style={{
                background: 'rgba(255,255,255,.03)',
                border: '1px solid rgba(255,255,255,.07)',
                borderRadius: 12,
                padding: '1.2rem 1.3rem',
                maxHeight: 480,
                overflowY: 'auto',
              }}>
                <pre style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'inherit',
                  color: '#d8dee9',
                  fontSize: '.92rem',
                  lineHeight: 1.85,
                }}>{result.lyrics}</pre>
              </div>
            </div>
          )}

          <div className="tool-card glass-card" style={{ marginTop: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#4ade80' }}>Tips</h3>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#ccc', lineHeight: 2 }}>
              <li>Add the artist for better matches: “Jeje Diamond Platnumz” beats just “Jeje”.</li>
              <li>Works with Bongo Flava, Afrobeats, Gengetone, gospel, and international chart songs.</li>
              <li>Use <strong>Copy Lyrics</strong> to paste straight into WhatsApp or your notes.</li>
            </ul>
            <p style={{ margin: '1rem 0 0', color: '#666', fontSize: '.8rem' }}>
              _Made by Toosii Tech · Free lyrics search_
            </p>
          </div>

        </div>
      </section>
    </Layout>
  )
}
