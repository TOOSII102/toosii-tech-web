'use client'
import Layout from '../../components/Layout'
import { useState } from 'react'
import './session.css'

export default function SessionPage() {
  const [tab, setTab] = useState('pair')
  const [number, setNumber] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [qrData, setQrData] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const generatePair = async () => {
    if (!number.trim()) return setError('Enter your WhatsApp number (with country code)')
    setLoading(true); setError(''); setSessionId('')
    try {
      const res = await fetch(`/api/pair?number=${encodeURIComponent(number.trim())}`)
      const data = await res.json()
      if (data.session_id || data.code) {
        setSessionId(data.session_id || data.code)
      } else {
        setError(data.error || 'Failed to generate session. Try again.')
      }
    } catch {
      setError('Network error. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const generateQR = async () => {
    setLoading(true); setError(''); setQrData('')
    try {
      const res = await fetch('/api/qr')
      const data = await res.json()
      if (data.qr) {
        setQrData(data.qr)
      } else {
        setError(data.error || 'QR generation failed. Try again.')
      }
    } catch {
      setError('Network error. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    navigator.clipboard.writeText(sessionId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Layout>
      <section className="session-hero">
        <div className="page-wrapper">
          <p className="section-label">Session Generator</p>
          <h1 className="section-title">Connect Your WhatsApp</h1>
          <p className="section-sub">
            Generate a session ID to run TOOSII XD ULTRA on your WhatsApp account.
            Choose pair code (no QR scan needed) or classic QR code.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="session-card glass-card">
            {/* Tabs */}
            <div className="session-tabs">
              <button className={`tab-btn ${tab === 'pair' ? 'active' : ''}`} onClick={() => { setTab('pair'); setError(''); setSessionId('') }}>
                📱 Pair Code
              </button>
              <button className={`tab-btn ${tab === 'qr' ? 'active' : ''}`} onClick={() => { setTab('qr'); setError(''); setQrData('') }}>
                📷 QR Code
              </button>
            </div>

            {/* Pair tab */}
            {tab === 'pair' && (
              <div className="tab-content">
                <p className="tab-desc">Enter your WhatsApp number with country code (e.g. 254712345678). A pairing code will be generated — enter it in WhatsApp → Linked Devices.</p>
                <div className="input-row">
                  <input
                    type="tel"
                    placeholder="e.g. 254712345678"
                    value={number}
                    onChange={e => setNumber(e.target.value)}
                    className="text-input"
                    onKeyDown={e => e.key === 'Enter' && generatePair()}
                  />
                  <button onClick={generatePair} disabled={loading} className="btn-primary">
                    {loading ? 'Generating…' : 'Generate'}
                  </button>
                </div>

                {error && <div className="error-box">{error}</div>}

                {sessionId && (
                  <div className="result-box">
                    <div className="result-header">
                      <span>✅ Session ID Generated</span>
                      <button onClick={copy} className="copy-btn">{copied ? '✔ Copied!' : 'Copy'}</button>
                    </div>
                    <code className="session-code">{sessionId}</code>
                    <p className="result-note">Save this in your bot's SESSION_ID environment variable.</p>
                  </div>
                )}
              </div>
            )}

            {/* QR tab */}
            {tab === 'qr' && (
              <div className="tab-content">
                <p className="tab-desc">Click the button to generate a QR code. Open WhatsApp → Linked Devices → Add Device and scan the code.</p>
                <button onClick={generateQR} disabled={loading} className="btn-primary" style={{ width: 'fit-content' }}>
                  {loading ? 'Generating QR…' : 'Generate QR Code'}
                </button>

                {error && <div className="error-box">{error}</div>}

                {qrData && (
                  <div className="qr-box">
                    <img src={qrData} alt="WhatsApp QR Code" className="qr-img" />
                    <p className="result-note">QR expires in 60 seconds. Scan quickly!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="steps-grid">
            {[
              { n: '01', title: 'Enter Number', desc: 'Type your full WhatsApp number with country code.' },
              { n: '02', title: 'Get Code / QR', desc: 'Click generate and wait a few seconds for your session.' },
              { n: '03', title: 'Link Device', desc: 'Enter the pair code or scan the QR in WhatsApp Linked Devices.' },
              { n: '04', title: 'Deploy Bot', desc: 'Copy the session ID into your bot and deploy.' },
            ].map(s => (
              <div key={s.n} className="step-card glass-card">
                <div className="step-number">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  )
}
