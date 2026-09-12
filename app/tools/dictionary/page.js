'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import '../tools.css'

const SUGGESTIONS = ['serendipity', 'Ubuntu', 'resilience', 'ephemeral']

export default function DictionaryTool() {
  const [word, setWord]     = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const lookup = async (override) => {
    const value = (typeof override === 'string' ? override : word).trim().toLowerCase()
    if (!value) return setError('Type a word to look up first.')
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch(`/api/tools/dictionary?q=${encodeURIComponent(value)}`)
      const data = await res.json()
      if (!res.ok) {
        const message = data?.error?.message || `No definition found for “${value}”.`
        return setError(typeof message === 'string' ? message : 'No definition found.')
      }
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
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.45rem 1rem', borderRadius: '999px', border: '1px solid rgba(34,211,238,.35)', background: 'rgba(34,211,238,.08)', color: '#67e8f9', fontSize: '.8rem', fontWeight: 700 }}>
              📚 Dictionary
            </span>
          </div>
          <h1 className="section-title">Know what <span className="gradient-text">words mean.</span></h1>
          <p className="section-sub">
            Full definitions, pronunciation audio, synonyms and antonyms for any word — handy for essays, interviews and everyday English. Free, no sign-up.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="tool-card glass-card">
            <div className="dl-search-wrapper">
              <span className="dl-search-icon">📚</span>
              <input
                type="text"
                placeholder="Type a word… e.g. serendipity"
                value={word}
                maxLength={40}
                onChange={e => { setWord(e.target.value); setError('') }}
                className="dl-search-input"
                onKeyDown={e => e.key === 'Enter' && !loading && lookup()}
                disabled={loading}
              />
              <button onClick={() => lookup()} disabled={loading} className="dl-search-btn">
                {loading ? 'Looking up…' : '🔍 Define'}
              </button>
            </div>

            {error && <p className="tool-error">{error}</p>}

            {!result && !loading && (
              <div style={{ display: 'flex', gap: '.5rem', marginTop: '.9rem', flexWrap: 'wrap' }}>
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => { setWord(s); lookup(s) }}
                    className="btn-outline"
                    style={{ fontSize: '.78rem', padding: '.35rem .8rem', color: '#d1d5db' }}
                  >
                    📖 {s}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
                <p style={{ margin: '.75rem 0 0', color: '#94a3b8', fontSize: '.9rem' }}>Looking that up…</p>
              </div>
            )}

            {result && (
              <div className="tool-card glass-card" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>
                  {result.word}
                  {result.phonetics?.[0]?.text && (
                    <span style={{ color: '#64748b', fontSize: '1rem', fontWeight: 400, marginLeft: '.6rem' }}>{result.phonetics[0].text}</span>
                  )}
                </h2>
                {result.phonetics?.[0]?.audio && (
                  <audio controls src={result.phonetics[0].audio} style={{ height: 36, margin: '.6rem 0 1rem', width: '100%', maxWidth: 260 }} />
                )}
                {result.meanings.map((meaning, i) => (
                  <div key={i} style={{ marginBottom: '1.25rem' }}>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '.72rem',
                      fontWeight: 800,
                      textTransform: 'italic',
                      color: '#67e8f9',
                      background: 'rgba(34,211,238,.1)',
                      border: '1px solid rgba(34,211,238,.3)',
                      borderRadius: 999,
                      padding: '.15rem .7rem',
                      marginBottom: '.6rem',
                    }}>{meaning.partOfSpeech || 'word'}</span>
                    <ol style={{ margin: 0, paddingLeft: '1.3rem', color: '#d8dee9', lineHeight: 1.8 }}>
                      {meaning.definitions.slice(0, 6).map((def, j) => (
                        <li key={j}>
                          {def.definition}
                          {def.synonyms?.length > 0 && (
                            <div style={{ color: '#64748b', fontSize: '.8rem', marginTop: '.15rem' }}>
                              Synonyms: {def.synonyms.slice(0, 6).join(', ')}
                            </div>
                          )}
                          {def.antonyms?.length > 0 && (
                            <div style={{ color: '#64748b', fontSize: '.8rem', marginTop: '.15rem' }}>
                              Antonyms: {def.antonyms.slice(0, 6).join(', ')}
                            </div>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="tool-card glass-card">
            <h3 style={{ margin: '0 0 1rem', color: '#4ade80' }}>Tips</h3>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#ccc', lineHeight: 2 }}>
              <li>Tap the 🔊 audio to hear the pronunciation.</li>
              <li>Each meaning lists synonyms and antonyms to round out your vocabulary.</li>
              <li>Great for interview prep, essays, and clearing up tricky words in church or class.</li>
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
