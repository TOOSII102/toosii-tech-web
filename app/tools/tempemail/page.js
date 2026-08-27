'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import '../tools.css'
import './tempemail.css'

const INBOX_MAP = {
  'guerrillamail.com':      u => `https://www.guerrillamail.com/inbox`,
  'guerrillamailblock.com': u => `https://www.guerrillamail.com/inbox`,
  'sharklasers.com':        u => `https://www.guerrillamail.com/inbox`,
  'grr.la':                 u => `https://www.guerrillamail.com/inbox`,
  'spam4.me':               u => `https://www.guerrillamail.com/inbox`,
  'guerrillamail.biz':      u => `https://www.guerrillamail.com/inbox`,
  'guerrillamail.de':       u => `https://www.guerrillamail.com/inbox`,
  'guerrillamail.net':      u => `https://www.guerrillamail.com/inbox`,
  'guerrillamail.org':      u => `https://www.guerrillamail.com/inbox`,
  'yopmail.com':            u => `https://yopmail.com/en/inbox.php?login=${u}`,
  'yopmail.fr':             u => `https://yopmail.com/en/inbox.php?login=${u}`,
  'cool.fr.nf':             u => `https://yopmail.com/en/inbox.php?login=${u}`,
  'jetable.fr.nf':          u => `https://yopmail.com/en/inbox.php?login=${u}`,
  'nospam.ze.tc':           u => `https://yopmail.com/en/inbox.php?login=${u}`,
  'maildrop.cc':            u => `https://maildrop.cc/inbox/?mailbox=${u}`,
  'mailinator.com':         u => `https://www.mailinator.com/v4/public/inboxes.jsp?to=${u}`,
  'dispostable.com':        u => `https://www.dispostable.com/inbox/${u}/`,
  'trashmail.com':          u => `https://trashmail.com/?cmd=get_emails&account=${u}`,
  'trashmail.at':           u => `https://trashmail.com/?cmd=get_emails&account=${u}`,
  'trashmail.me':           u => `https://trashmail.com/?cmd=get_emails&account=${u}`,
  'trashmail.net':          u => `https://trashmail.com/?cmd=get_emails&account=${u}`,
  'fakeinbox.com':          u => `https://fakeinbox.com/inbox.php?q=${u}`,
  'mailnull.com':           u => `https://www.mailnull.com/`,
  'throwam.com':            u => `https://throwam.com/`,
}

function getInboxUrl(email) {
  const [user, domain] = email.split('@')
  if (!domain) return null
  const fn = INBOX_MAP[domain.toLowerCase()]
  return fn ? fn(user) : `https://temp-mail.org/`
}

const steps = [
  {
    num: '1',
    icon: '⚡',
    title: 'Generate',
    body: 'Click the button below and get 3 fresh disposable addresses instantly — no sign-up.',
  },
  {
    num: '2',
    icon: '📋',
    title: 'Copy & Use',
    body: 'Copy any address and paste it into any form — newsletters, trials, download gates, anything.',
  },
  {
    num: '3',
    icon: '📬',
    title: 'Check Inbox',
    body: 'Click "Open Inbox" next to your address to read any email that was sent to it.',
  },
  {
    num: '4',
    icon: '✅',
    title: 'Done',
    body: 'Once you have what you need, just close the tab. The address expires on its own.',
  },
]

function EmailCard({ email, onCopy, copied }) {
  const [user, domain] = email.split('@')
  const inboxUrl = getInboxUrl(email)
  const isCopied = copied === email

  return (
    <div className="te-email-card">
      <div className="te-email-icon">📧</div>
      <div className="te-email-address-wrap">
        <span className="te-email-address">{email}</span>
        <span className="te-email-domain">{domain}</span>
      </div>
      <div className="te-email-btns">
        <button
          onClick={() => onCopy(email)}
          className={`te-copy-btn${isCopied ? ' copied' : ''}`}
        >
          {isCopied ? '✅ Copied!' : '📋 Copy'}
        </button>
        <a
          href={inboxUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="te-inbox-btn"
          title={`Open inbox for ${email}`}
        >
          📬 Open Inbox ↗
        </a>
      </div>
    </div>
  )
}

export default function TempEmail() {
  const [emails, setEmails]   = useState([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState('')
  const [error, setError]     = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    setEmails([])
    setCopied('')
    try {
      const res  = await fetch('/api/tools/tempemail?count=3')
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to generate addresses. Please try again.')
        return
      }
      setEmails(data.emails || [data.email])
    } catch {
      setError('Network error — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const copy = (email) => {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(email)
      setTimeout(() => setCopied(''), 2500)
    })
  }

  return (
    <Layout>

      {/* ── Hero ── */}
      <section className="tool-hero">
        <div className="page-wrapper" style={{ textAlign: 'center' }}>
          <div className="badge" style={{ marginBottom: '1.25rem' }}>
            <span>📧</span> Temp Email
          </div>
          <h1 className="section-title">
            Disposable Email.<br />
            <span className="gradient-text">Zero Trace.</span>
          </h1>
          <p className="section-sub" style={{ maxWidth: 520, margin: '0 auto' }}>
            Get instant throwaway email addresses — sign up for anything without exposing your real inbox. No account, no setup, no spam that follows you home.
          </p>
          <div className="te-hero-badges">
            <span className="te-hero-badge">⚡ Instant</span>
            <span className="te-hero-badge">🔒 No Sign-up</span>
            <span className="te-hero-badge">🗑️ Auto-expires</span>
            <span className="te-hero-badge">🌐 Any device</span>
          </div>
        </div>
      </section>

      {/* ── Main tool card ── */}
      <section className="section" style={{ paddingTop: '0.5rem' }}>
        <div className="page-wrapper">
          <div className="tool-card glass-card">

            {emails.length === 0 ? (
              <div className="te-empty-state">
                <span className="te-empty-icon">📬</span>
                <p className="te-empty-desc">
                  Click below to generate <strong style={{ color: '#fff' }}>3 fresh disposable email addresses</strong> at once. Pick whichever one you prefer and use it immediately.
                </p>
                <button
                  onClick={generate}
                  disabled={loading}
                  className="te-generate-btn"
                >
                  {loading ? (
                    <>
                      <span className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />
                      Generating…
                    </>
                  ) : '📧 Generate 3 Addresses'}
                </button>
              </div>
            ) : (
              <>
                <div className="te-result-header">
                  <p className="te-result-label">
                    <strong>{emails.length} fresh addresses</strong> — pick any one
                  </p>
                  <button
                    onClick={generate}
                    disabled={loading}
                    className="te-refresh-btn"
                  >
                    {loading ? '⏳ Refreshing…' : '🔄 Refresh All'}
                  </button>
                </div>

                <div className="te-email-list">
                  {emails.map(e => (
                    <EmailCard key={e} email={e} onCopy={copy} copied={copied} />
                  ))}
                </div>

                <div className="te-warning">
                  <span className="te-warning-icon">⚠️</span>
                  <span>
                    <strong>These addresses expire.</strong> Don&apos;t use them for accounts you need long-term. Inbox links open a third-party reader — no data is stored by this site.
                  </span>
                </div>
              </>
            )}

            {error && (
              <div className="te-error">
                <span>❌</span>
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="section" style={{ paddingTop: '0.5rem', paddingBottom: '1.5rem' }}>
        <div className="page-wrapper">
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <p className="section-label">Step by step</p>
            <h2 className="section-title" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.8rem)' }}>How it works</h2>
          </div>
          <div className="te-steps-grid">
            {steps.map(s => (
              <div key={s.num} className="te-step-card glass-card">
                <div className="te-step-num">{s.num}</div>
                <h3 className="te-step-title">{s.icon} {s.title}</h3>
                <p className="te-step-body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Info / notes ── */}
      <section className="section" style={{ paddingTop: '0.5rem', paddingBottom: '5rem' }}>
        <div className="page-wrapper">
          <div className="te-info-card glass-card">
            <h3 className="te-info-heading">📬 Can&apos;t see your email in the inbox?</h3>
            <p className="te-info-body">
              If the inbox button doesn&apos;t show your message right away, wait 10–20 seconds and refresh. Some providers have a slight delay. You can also visit{' '}
              <a href="https://www.guerrillamail.com" target="_blank" rel="noopener noreferrer">guerrillamail.com</a>{' '}
              or{' '}
              <a href="https://yopmail.com" target="_blank" rel="noopener noreferrer">yopmail.com</a>{' '}
              and paste your address there manually to check.
            </p>
            <div className="te-info-note">
              Made by Toosii Tech · Free & instant · No tracking · No data stored
            </div>
          </div>
        </div>
      </section>

    </Layout>
  )
}
