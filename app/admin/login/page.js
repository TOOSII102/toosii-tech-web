'use client'
  import { useState } from 'react'
  import { useRouter } from 'next/navigation'
  import Link from 'next/link'
  import './login.css'

  export default function AdminLogin() {
    const router = useRouter()
    const [email,    setEmail]   = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error,    setError]   = useState('')
    const [loading,  setLoading] = useState(false)

    async function handleSubmit(e) {
      e.preventDefault()
      setError('')
      setLoading(true)
      try {
        const res  = await fetch('/api/admin/login', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (data.success) {
          router.push('/admin')
        } else {
          setError(data.error || 'Invalid credentials')
        }
      } catch {
        setError('Connection error. Please try again.')
      }
      setLoading(false)
    }

    return (
      <div className="al-root">
        <div className="al-card">
          <div className="al-logo"><img src="/logo.png" alt="Toosii Tech" className="al-logo-img" /></div>
          <h1 className="al-title">Toosii Tech</h1>
          <p className="al-subtitle">Admin Dashboard</p>

          <form className="al-form" onSubmit={handleSubmit}>
            <div className="al-field">
              <label className="al-label" htmlFor="email">Email</label>
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

            <div className="al-field">
              <div className="al-label-row">
                <label className="al-label" htmlFor="password">Password</label>
                <Link href="/admin/forgot-password" className="al-forgot">Forgot password?</Link>
              </div>
              <div className="al-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="al-input al-input--password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="al-eye"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    /* eye-off */
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                         stroke="currentColor" strokeWidth="2"
                         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    /* eye */
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                         stroke="currentColor" strokeWidth="2"
                         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="al-error">
                <span>⚠</span> {error}
              </div>
            )}

            <button type="submit" className="al-btn" disabled={loading}>
              {loading ? (
                <><span className="al-spinner" /> Signing in…</>
              ) : 'Sign In →'}
            </button>
          </form>

          <a href="/" className="al-back">← Back to Toosii Tech</a>
        </div>
      </div>
    )
  }
  