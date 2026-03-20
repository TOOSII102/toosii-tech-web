'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import '../tools.css'

const INBOX_MAP = {
  'guerrillamail.com':   u => `https://www.guerrillamail.com/inbox`,
  'guerrillamailblock.com': u => `https://www.guerrillamail.com/inbox`,
  'sharklasers.com':     u => `https://www.guerrillamail.com/inbox`,
  'grr.la':              u => `https://www.guerrillamail.com/inbox`,
  'spam4.me':            u => `https://www.guerrillamail.com/inbox`,
  'guerrillamail.biz':   u => `https://www.guerrillamail.com/inbox`,
  'guerrillamail.de':    u => `https://www.guerrillamail.com/inbox`,
  'guerrillamail.net':   u => `https://www.guerrillamail.com/inbox`,
  'guerrillamail.org':   u => `https://www.guerrillamail.com/inbox`,
  'yopmail.com':         u => `https://yopmail.com/en/inbox.php?login=${u}`,
  'yopmail.fr':          u => `https://yopmail.com/en/inbox.php?login=${u}`,
  'cool.fr.nf':          u => `https://yopmail.com/en/inbox.php?login=${u}`,
  'jetable.fr.nf':       u => `https://yopmail.com/en/inbox.php?login=${u}`,
  'nospam.ze.tc':        u => `https://yopmail.com/en/inbox.php?login=${u}`,
  'maildrop.cc':         u => `https://maildrop.cc/inbox/?mailbox=${u}`,
  'mailnull.com':        u => `https://www.mailnull.com/`,
  'throwam.com':         u => `https://throwam.com/`,
  'dispostable.com':     u => `https://www.dispostable.com/inbox/${u}/`,
  'mailinator.com':      u => `https://www.mailinator.com/v4/public/inboxes.jsp?to=${u}`,
  'trashmail.com':       u => `https://trashmail.com/?cmd=get_emails&account=${u}`,
  'trashmail.at':        u => `https://trashmail.com/?cmd=get_emails&account=${u}`,
  'trashmail.me':        u => `https://trashmail.com/?cmd=get_emails&account=${u}`,
  'trashmail.net':       u => `https://trashmail.com/?cmd=get_emails&account=${u}`,
  'fakeinbox.com':       u => `https://fakeinbox.com/inbox.php?q=${u}`,
}

function getInboxUrl(email) {
  const [user, domain] = email.split('@')
  if (!domain) return null
  const fn = INBOX_MAP[domain.toLowerCase()]
  return fn ? fn(user) : null
}

function EmailCard({ email, onCopy, copied }) {
  const inboxUrl = getInboxUrl(email)
  const domain   = email.split('@')[1] || ''

  return (
    <div style={{
      background: '#0d0d1a',
      border: '1px solid #25d366',
      borderRadius: 10,
      padding: '1rem 1.2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      flexWrap: 'wrap',
      marginBottom: '0.85rem',
    }}>
      <span style={{ color: '#25d366', fontWeight: 700, fontSize: '1rem', wordBreak: 'break-all', flex: 1, minWidth: 160 }}>
        {email}
      </span>
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
        <button
          onClick={() => onCopy(email)}
          className="btn-primary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', minHeight: 36 }}
        >
          {copied === email ? '✅ Copied!' : '📋 Copy'}
        </button>
        {inboxUrl ? (
          <a
            href={inboxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', minHeight: 36, textDecoration: 'none' }}
          >
            📬 Check Inbox
          </a>
        ) : (
          <a
            href={`https://temp-mail.org/`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', minHeight: 36, textDecoration: 'none' }}
            title={`Visit temp-mail.org and enter ${email}`}
          >
            📬 Check Inbox
          </a>
        )}
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
    setLoading(true); setError(''); setEmails([]); setCopied('')
    try {
      const res  = await fetch('/api/tools/tempemail?count=3')
      const data = await res.json()
      if (!res.ok || data.error) return setError(data.error || 'Failed to generate. Try again.')
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
      setTimeout(() => setCopied(''), 2000)
    })
  }

  return (
    <Layout>
      <section className="tool-hero">
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>📧</span> Temp Email</div>
          <h1 className="section-title">Temporary Email Generator</h1>
          <p className="section-sub">
            Get 3 disposable email addresses instantly. Use one to sign up — then open its inbox to receive the confirmation email. No account required.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">

          <div className="tool-card glass-card">
            {emails.length === 0 ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#aaa', marginBottom: '1.5rem', lineHeight: 1.7 }}>
                  Click below to generate <strong style={{ color: '#fff' }}>3 fresh disposable email addresses</strong> at once. Pick any one and use it anywhere.
                </p>
                <button onClick={generate} disabled={loading} className="btn-primary" style={{ fontSize: '1rem', padding: '.85rem 2rem' }}>
                  {loading ? '⏳ Generating…' : '📧 Generate 3 Emails'}
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <p style={{ margin: 0, color: '#aaa', fontSize: '.9rem' }}>Pick any address — click <strong style={{ color: '#25d366' }}>Check Inbox</strong> after using it:</p>
                  <button onClick={generate} disabled={loading} className="btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1.1rem' }}>
                    {loading ? '⏳…' : '🔄 Refresh All'}
                  </button>
                </div>

                {emails.map(e => (
                  <EmailCard key={e} email={e} onCopy={copy} copied={copied} />
                ))}

                <div style={{ marginTop: '0.5rem', padding: '0.85rem 1rem', background: 'rgba(240,165,0,0.08)', borderRadius: 8, border: '1px solid rgba(240,165,0,0.25)' }}>
                  <p style={{ margin: 0, color: '#f0a500', fontSize: '0.82rem' }}>
                    ⚠️ <strong>These addresses expire.</strong> Do not use them for accounts you need long-term. Inbox links open a third-party reader — no data is stored by this site.
                  </p>
                </div>
              </>
            )}
            {error && <p className="tool-error" style={{ marginTop: '1rem' }}>{error}</p>}
          </div>

          <div className="tool-card glass-card" style={{ marginTop: '2rem' }}>
            <h3 style={{ margin: '0 0 1.25rem', color: '#25d366' }}>How to use a temp email — step by step</h3>

            {[
              {
                step: '1',
                title: 'Generate addresses',
                body: 'Click "Generate 3 Emails" above. You\'ll get 3 different addresses at once — pick whichever one you prefer.',
              },
              {
                step: '2',
                title: 'Copy it and sign up',
                body: 'Click 📋 Copy next to the address you want. Paste it into the sign-up form of any website or app — newsletters, free trials, download gates, anything.',
              },
              {
                step: '3',
                title: 'Open the inbox to read your email',
                body: 'After signing up, click 📬 Check Inbox next to the same address. This opens the inbox for that address in a new tab. Wait a few seconds and refresh — your confirmation or verification email will appear there.',
              },
              {
                step: '4',
                title: 'Done — discard it after',
                body: 'Once you\'ve confirmed your account or grabbed what you needed, simply close the tab. The address and its inbox disappear on their own — no cleanup needed.',
              },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', gap: '1rem', marginBottom: '1.1rem' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#25d366', color: '#000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.9rem', flexShrink: 0,
                }}>
                  {s.step}
                </div>
                <div>
                  <strong style={{ color: '#fff', display: 'block', marginBottom: '0.25rem' }}>{s.title}</strong>
                  <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.65, fontSize: '0.9rem' }}>{s.body}</p>
                </div>
              </div>
            ))}

            <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#0d0d1a', borderRadius: 8, border: '1px solid #222' }}>
              <p style={{ margin: '0 0 0.5rem', color: '#ccc', fontSize: '0.875rem', fontWeight: 600 }}>📬 Can't see an inbox button for your address?</p>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6 }}>
                Go to <a href="https://temp-mail.org" target="_blank" rel="noopener noreferrer" style={{ color: '#25d366' }}>temp-mail.org</a> or <a href="https://www.guerrillamail.com" target="_blank" rel="noopener noreferrer" style={{ color: '#25d366' }}>guerrillamail.com</a> and paste your address there to check for messages.
              </p>
            </div>

            <p style={{ margin: '1rem 0 0', color: '#444', fontSize: '.8rem' }}>Made by Toosii Tech · Free & instant · No tracking</p>
          </div>
        </div>
      </section>
    </Layout>
  )
}
