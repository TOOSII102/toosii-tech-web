'use client'
  import { useState, useEffect, Suspense } from 'react'
  import { useRouter, useSearchParams } from 'next/navigation'
  import Link from 'next/link'
  import '../login/login.css'

  function ResetPasswordContent() {
    const router       = useRouter()
    const searchParams = useSearchParams()
    const token        = searchParams.get('token')

    const [status,  setStatus]  = useState('idle') // idle | loading | success | error | invalid
    const [message, setMessage] = useState('')

    useEffect(() => {
      if (!token) {
        setStatus('invalid')
        setMessage('No reset token found. Please request a new reset link.')
      }
    }, [token])

    async function handleReset() {
      if (!token) return
      setStatus('loading')
      try {
        const res  = await fetch('/api/admin/reset-password', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ token }),
        })
        const data = await res.json()
        if (data.success) {
          setStatus('success')
          setMessage('You are now signed in! Redirecting to dashboard…')
          setTimeout(() => router.push('/admin'), 2000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Invalid or expired link.')
        }
      } catch {
        setStatus('error')
        setMessage('Connection error. Please try again.')
      }
    }

    return (
      <div className="al-root">
        <div className="al-card">
          <div className="al-logo">🔑</div>
          <h1 className="al-title">Sign In via Link</h1>
          <p className="al-subtitle">One-click access to your dashboard</p>

          {status === 'idle' && token && (
            <>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Click the button below to sign in to the admin dashboard. This link expires in 15 minutes.
              </p>
              <button className="al-btn" onClick={handleReset} style={{ width: '100%' }}>
                Sign In to Dashboard →
              </button>
            </>
          )}

          {status === 'loading' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8' }}>
              <span className="al-spinner" style={{ borderTopColor: '#25d366' }} />
              Verifying link…
            </div>
          )}

          {status === 'success' && (
            <div className="al-success" style={{ width: '100%', textAlign: 'center' }}>✅ {message}</div>
          )}

          {(status === 'error' || status === 'invalid') && (
            <>
              <div className="al-error" style={{ width: '100%', marginBottom: '1rem' }}>
                <span>⚠</span> {message}
              </div>
              <Link href="/admin/forgot-password" className="al-btn" style={{ textDecoration: 'none', width: '100%', boxSizing: 'border-box' }}>
                Request a New Link
              </Link>
            </>
          )}

          <Link href="/admin/login" className="al-back" style={{ marginTop: '1.5rem' }}>
            ← Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  export default function ResetPassword() {
    return (
      <Suspense fallback={<div className="al-root"><div className="al-card"><p style={{color:'#64748b'}}>Loading…</p></div></div>}>
        <ResetPasswordContent />
      </Suspense>
    )
  }
  