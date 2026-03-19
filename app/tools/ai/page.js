'use client'
import Layout from '../../../components/Layout'
import { useState, useRef, useEffect } from 'react'
import '../tools.css'

export default function AiChat() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I\'m powered by Gemini AI. Ask me anything — questions, explanations, ideas, code help — I\'ve got you.', source: 'Gemini' }
  ])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    const q = input.trim()
    if (!q || loading) return

    setMessages(prev => [...prev, { role: 'user', text: q }])
    setInput(''); setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/tools/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'AI failed to respond.')
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: data.reply, source: data.source }])
      }
    } catch {
      setError('Network error — please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const clear = () => {
    setMessages([{ role: 'bot', text: 'Chat cleared! Ask me anything.', source: 'Gemini' }])
    setError('')
  }

  return (
    <Layout>
      <section className="tool-hero">
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>🤖</span> AI Chat</div>
          <h1 className="section-title">Chat with AI</h1>
          <p className="section-sub">Ask questions, get explanations, brainstorm ideas — powered by Gemini AI.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="tool-card glass-card">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
              <button onClick={clear} className="copy-btn">Clear chat</button>
            </div>

            <div className="ai-messages">
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div className={`ai-bubble ${m.role}`}>{m.text}</div>
                  {m.source && <span className="ai-source">— {m.source}</span>}
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf: 'flex-start' }}>
                  <div className="ai-bubble bot" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <div className="spinner" style={{ borderTopColor: '#94a3b8', borderColor: 'rgba(148,163,184,0.3)' }} />
                    <span style={{ color: '#64748b' }}>Thinking…</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {error && <div className="error-box" style={{ marginTop: '0.75rem' }}>{error}</div>}

            <div className="ai-input-row">
              <input
                type="text"
                placeholder="Ask anything…"
                value={input}
                onChange={e => setInput(e.target.value)}
                className="text-input"
                onKeyDown={e => e.key === 'Enter' && !loading && send()}
                disabled={loading}
              />
              <button onClick={send} disabled={loading || !input.trim()} className="btn-primary">
                Send
              </button>
            </div>
          </div>

          <div className="tips-grid">
            {[
              { icon: '🤖', title: 'Gemini Powered',   desc: 'Backed by Google Gemini AI with Copilot fallback.' },
              { icon: '💬', title: 'Ask Anything',      desc: 'Code, trivia, essays, advice — anything goes.' },
              { icon: '⚡', title: 'Fast Replies',      desc: 'Most responses arrive within a few seconds.' },
              { icon: '🔒', title: 'No Sign-up',        desc: 'Jump straight in — no account required.' },
            ].map(t => (
              <div key={t.title} className="tip-card glass-card">
                <span className="tip-icon">{t.icon}</span>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  )
}
