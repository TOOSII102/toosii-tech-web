'use client'
import { useState } from 'react'
import Link from 'next/link'
import '../login/login.css'

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [status,  setStatus]  = useState(null) // 'sent' | 'error'
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      const res  = await fetch('/api/admin/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus('sent')
        setMessage('If that email is registered, you will receive a reset link shortly. Check your inbox (and spam folder).')
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Connection error. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="al-root">
      <div className="al-card">
       <div className="al-logo"><img src="/logo.png" alt="Toosii Tech" className="al-logo-img" /></div>
        <h1 className="al-title">Forgot Password</h1>
        <p className="al-subtitle">We&apos;ll email you a sign-in link</p>

        {status === 'sent' ? (
          <>
            <div className="al-success" style={{ width: '100%', textAlign: 'center' }}>
              ✅ {message}
            </div>
            <Link href="/admin/login" className="al-btn" style={{ marginTop: '1.5rem', textDecoration: 'none' }}>
              Back to Sign In
            </Link>
          </>
        ) : (
          <form className="al-form" onSubmit={handleSubmit}>
            <div className="al-field">
              <label className="al-label" htmlFor="email">Admin Email</label>
              <input
                id="email"
                type="email"
                className="al-input"
                placeholder="admin@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>

            {status === 'error' && (
              <div className="al-error"><span>⚠</span> {message}</div>
            )}

            <button type="submit" className="al-btn" disabled={loading}>
              {loading ? <><span className="al-spinner" /> Sending…</> : 'Send Reset Link →'}
            </button>

            <div className="al-divider" />

            <Link href="/admin/login" className="al-btn-outline">← Back to Sign In</Link>
          </form>
        )}
      </div>
    </div>
  )
}
