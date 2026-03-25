'use client'
  import { useState } from 'react'
  import { useRouter } from 'next/navigation'
  import Link from 'next/link'
  import './login.css'

  export default function AdminLogin() {
    const router = useRouter()
    const [email,    setEmail]   = useState('')
    const [password, setPassword] = useState('')
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
          <div className="al-logo">⚡</div>
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
              <input
                id="password"
                type="password"
                className="al-input"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
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
  