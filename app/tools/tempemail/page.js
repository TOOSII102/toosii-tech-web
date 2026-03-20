'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import '../tools.css'

export default function TempEmail() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(false)
  const [error, setError]     = useState('')

  const generate = async () => {
    setLoading(true); setError(''); setEmail(''); setCopied(false)
    try {
      const res  = await fetch('/api/tools/tempemail')
      const data = await res.json()
      if (!res.ok || data.error) return setError(data.error || 'Failed to generate. Try again.')
      setEmail(data.email)
    } catch {
      setError('Network error — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    if (!email) return
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Layout>
      <section className="tool-hero">
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>📧</span> Temp Email</div>
          <h1 className="section-title">Temporary Email Generator</h1>
          <p className="section-sub">
            Generate a disposable email address instantly. Use it to sign up for services without exposing your real inbox — no registration required.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">

          <div className="tool-card glass-card" style={{ textAlign: 'center' }}>
            {email ? (
              <>
                <p style={{ color: '#aaa', fontSize: '.9rem', marginBottom: '.8rem' }}>Your temporary email address:</p>
                <div style={{
                  background: '#0d0d1a',
                  border: '1px solid #25d366',
                  borderRadius: 10,
                  padding: '1rem 1.5rem',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#25d366',
                  letterSpacing: '.02em',
                  wordBreak: 'break-all',
                  marginBottom: '1.2rem',
                }}>
                  {email}
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={copy} className="btn-primary">
                    {copied ? '✅ Copied!' : '📋 Copy Email'}
                  </button>
                  <button onClick={generate} disabled={loading} className="btn-secondary">
                    {loading ? 'Generating…' : '🔄 New Email'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ color: '#aaa', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  Click below to generate a fresh disposable email address. No sign-up, no tracking.
                </p>
                <button onClick={generate} disabled={loading} className="btn-primary" style={{ fontSize: '1rem', padding: '.8rem 2rem' }}>
                  {loading ? '⏳ Generating…' : '📧 Generate Email'}
                </button>
              </>
            )}
            {error && <p className="tool-error" style={{ marginTop: '1rem' }}>{error}</p>}
          </div>

          <div className="tool-card glass-card" style={{ marginTop: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#25d366' }}>How to use it</h3>
            <ol style={{ margin: 0, paddingLeft: '1.2rem', color: '#ccc', lineHeight: 2 }}>
              <li>Click <strong>Generate Email</strong> to get a disposable address.</li>
              <li>Copy the email and use it when signing up for any service.</li>
              <li>Generate a new one anytime — each click gives a fresh address.</li>
              <li>Use it to avoid spam in your real inbox.</li>
            </ol>
            <div style={{ marginTop: '1.2rem', padding: '1rem', background: '#0d0d1a', borderRadius: 8, border: '1px solid #333' }}>
              <p style={{ margin: 0, color: '#f0a500', fontSize: '.85rem' }}>
                ⚠️ <strong>Note:</strong> These are disposable addresses. Do not use them for accounts you plan to keep long-term.
              </p>
            </div>
            <p style={{ margin: '1rem 0 0', color: '#666', fontSize: '.8rem' }}>
              _Made by Toosii Tech · Free & instant_
            </p>
          </div>
        </div>
      </section>
    </Layout>
  )
}
