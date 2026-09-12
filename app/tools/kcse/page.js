'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import '../tools.css'

const GRADE_RE = /^(A\*|A|B\+|B|C\+|C|D\+|D|E)$/

function highlightFields(result) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return null
  const flat = {}
  for (const [key, value] of Object.entries(result)) {
    if (value === null || value === undefined) continue
    const k = key.toLowerCase()
    if (k === 'name' || k === 'candidate') flat.name = String(value)
    if (k === 'index' || k === 'indexno' || k === 'index_number') flat.index = String(value)
    if (k === 'school' || k === 'schoolname') flat.school = String(value)
    if (k === 'grade' || k === 'overallgrade' || k === 'finalgrade') flat.grade = String(value)
    if (k === 'meanscore' || k === 'mean' || k === 'means') flat.mean = String(value)
    if (k === 'cluster') flat.cluster = String(value)
    if (k === 'county') flat.county = String(value)
    if (k === 'total') flat.total = String(value)
  }
  const subjects = Object.entries(result)
    .find(([key, value]) => /subject|marks/i.test(key) && Array.isArray(value))?.[1]
  if (subjects?.length) flat.subjects = subjects
  return Object.keys(flat).length ? flat : null
}

export default function KcseTool() {
  const [index, setIndex] = useState('')
  const [name, setName]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [result, setResult]   = useState(null)
  const [copied, setCopied]   = useState(false)

  const check = async () => {
    if (!/^\d{7,12}$/.test(index.trim())) return setError('Enter a valid KCSE index number (7 to 12 digits).')
    if (name.trim().length < 3) return setError('Enter the full candidate name as registered with KNEC.')
    setLoading(true); setError(''); setResult(null); setCopied(false)
    try {
      const res = await fetch(`/api/tools/knec?index=${encodeURIComponent(index.trim())}&name=${encodeURIComponent(name.trim())}`)
      const data = await res.json()
      if (!res.ok) {
        const message = data?.error?.message || 'KCSE result check is unavailable right now. Try again in a few minutes.'
        return setError(typeof message === 'string' ? message : 'KCSE result check is unavailable right now.')
      }
      setResult(data)
    } catch {
      setError('Network error — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyResult = async () => {
    if (!result) return
    try { await navigator.clipboard.writeText(JSON.stringify(result.result, null, 2)) } catch { /* ignore */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const raw = result?.result
  const highlights = highlightFields(raw)

  return (
    <Layout>
      <section className="tool-hero">
        <div className="page-wrapper">
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.45rem 1rem', borderRadius: '999px', border: '1px solid rgba(239,68,68,.35)', background: 'rgba(239,68,68,.08)', color: '#fca5a5', fontSize: '.8rem', fontWeight: 700 }}>
              🎓 KCSE Results Checker
            </span>
          </div>
          <h1 className="section-title">Your results, <span className="gradient-text">right here.</span></h1>
          <p className="section-sub">
            Enter your KCSE index number and full name to fetch your KNEC result — grade, mean score and subjects. Free, no SMS, no middleman.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="tool-card glass-card">
            <div className="essentials-form-row">
              <div className="dl-search-wrapper">
                <span className="dl-search-icon">🔢</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="KCSE index number — e.g. 12345678"
                  value={index}
                  maxLength={12}
                  onChange={e => { setIndex(e.target.value.replace(/[^\d]/g, '')); setError('') }}
                  className="dl-search-input"
                  disabled={loading}
                />
              </div>
              <div className="dl-search-wrapper">
                <span className="dl-search-icon">👤</span>
                <input
                  type="text"
                  placeholder="Full candidate name"
                  value={name}
                  maxLength={80}
                  onChange={e => { setName(e.target.value); setError('') }}
                  className="dl-search-input"
                  onKeyDown={e => e.key === 'Enter' && !loading && check()}
                  disabled={loading}
                />
              </div>
            </div>
            <button onClick={check} disabled={loading} className="dl-search-btn" style={{ width: '100%', marginTop: '.75rem' }}>
              {loading ? 'Checking KNEC…' : '🎓 Check My Result'}
            </button>

            {error && <p className="tool-error">{error}</p>}

            {loading && (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
                <p style={{ margin: '.75rem 0 0', color: '#94a3b8', fontSize: '.9rem' }}>
                  Talking to the KNEC feed — this can take up to a minute…
                </p>
              </div>
            )}

            {result && (
              <div className="essentials-result-box">
                {highlights && (
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {highlights.grade && (
                      <div>
                        <div style={{ fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b', fontWeight: 700 }}>Grade</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: GRADE_RE.test(highlights.grade) ? '#72f0ba' : '#f1f5f9' }}>{highlights.grade}</div>
                      </div>
                    )}
                    {highlights.mean && (
                      <div>
                        <div style={{ fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b', fontWeight: 700 }}>Mean Score</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#72f0ba' }}>{highlights.mean}</div>
                      </div>
                    )}
                    {highlights.school && (
                      <div>
                        <div style={{ fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b', fontWeight: 700 }}>School</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9' }}>{highlights.school}</div>
                      </div>
                    )}
                  </div>
                )}
                {highlights?.subjects && Array.isArray(highlights.subjects) && highlights.subjects.length > 0 && (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="stand-table" style={{ marginTop: 0 }}>
                      <thead>
                        <tr><th>Subject</th><th className="num">Marks</th><th className="num">Grade</th></tr>
                      </thead>
                      <tbody>
                        {highlights.subjects.map((s, i) => {
                          const subject = s?.subject || s?.name || s?.subjectName || '—'
                          const marks = s?.marks ?? s?.score ?? s?.total ?? '—'
                          const grade = s?.grade ?? '—'
                          return (
                            <tr key={i}>
                              <td>{subject}</td>
                              <td className="num">{marks}</td>
                              <td className="num">{grade}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                <details style={{ marginTop: '1rem' }}>
                  <summary style={{ cursor: 'pointer', color: '#94a3b8', fontSize: '.85rem' }}>View full raw result</summary>
                  <pre style={{
                    margin: '.75rem 0 0',
                    padding: '1rem',
                    background: 'rgba(0,0,0,.35)',
                    border: '1px solid rgba(255,255,255,.08)',
                    borderRadius: 10,
                    overflowX: 'auto',
                    color: '#d8dee9',
                    fontSize: '.8rem',
                    lineHeight: 1.6,
                  }}>{JSON.stringify(raw, null, 2)}</pre>
                </details>
                <div style={{ display: 'flex', gap: '.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <button className="btn-outline" style={{ fontSize: '.8rem', padding: '.4rem .9rem' }} onClick={copyResult}>
                    {copied ? '✓ Copied' : '📋 Copy Result'}
                  </button>
                </div>
                <p className="essentials-mut" style={{ marginTop: '1rem' }}>{result.notice}</p>
              </div>
            )}
          </div>

          <div className="tool-card glass-card">
            <h3 style={{ margin: '0 0 1rem', color: '#4ade80' }}>Before you check</h3>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#ccc', lineHeight: 2 }}>
              <li>Your <strong>index number</strong> is the one printed on your KCSE index card (not the new national ID).</li>
              <li>The <strong>full name must match KNEC records exactly</strong> — same spelling, same order.</li>
              <li>The KNEC feed gets busy during results week, so a check can take longer or fail — just retry.</li>
              <li>For official purposes, always confirm on the KNEC portal.</li>
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
