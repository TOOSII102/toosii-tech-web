'use client'
import Layout from '../../../components/Layout'
import { useState, useRef, useEffect } from 'react'
import '../tools.css'
import './toosii-ai.css'

const SUGGESTED = [
  'What can you help me with?',
  'Write a short story about a robot',
  'Explain how WhatsApp bots work',
  'Give me 5 business ideas for 2025',
]

export default function ToosiiAI() {
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const bottomRef = useRef()
  const inputRef  = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    const q = (text || input).trim()
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
        setError(data.error || 'Something went wrong. Try again.')
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: data.reply, model: data.model }])
      }
    } catch {
      setError('Network error — check your connection and try again.')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const clear = () => { setMessages([]); setError('') }

  const isEmpty = messages.length === 0

  return (
    <Layout>
      <div className="tai-page">
        {/* Header */}
        <div className="tai-header">
          <div className="tai-logo">
            <div className="tai-logo-icon">T</div>
            <div>
              <div className="tai-logo-name">Toosii AI</div>
              <div className="tai-logo-sub">Powered by ChatGPT · Always free</div>
            </div>
          </div>
          {!isEmpty && (
            <button onClick={clear} className="tai-clear-btn">New chat</button>
          )}
        </div>

        {/* Chat area */}
        <div className="tai-body">
          {isEmpty ? (
            <div className="tai-welcome">
              <div className="tai-welcome-icon">🤖</div>
              <h2 className="tai-welcome-title">How can I help you today?</h2>
              <p className="tai-welcome-sub">Ask me anything — questions, stories, code, advice, or just chat.</p>
              <div className="tai-suggestions">
                {SUGGESTED.map((s, i) => (
                  <button key={i} className="tai-suggestion" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="tai-messages">
              {messages.map((m, i) => (
                <div key={i} className={`tai-msg-row ${m.role}`}>
                  {m.role === 'bot' && <div className="tai-avatar">T</div>}
                  <div className="tai-bubble-wrap">
                    <div className={`tai-bubble ${m.role}`}>{m.text}</div>
                    {m.model && <div className="tai-model-tag">{m.model}</div>}
                  </div>
                  {m.role === 'user' && <div className="tai-avatar user">U</div>}
                </div>
              ))}
              {loading && (
                <div className="tai-msg-row bot">
                  <div className="tai-avatar">T</div>
                  <div className="tai-bubble bot tai-typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}
              {error && (
                <div className="error-box" style={{ margin: '0.5rem 0' }}>{error}</div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="tai-input-area">
          <div className="tai-input-box">
            <textarea
              ref={inputRef}
              className="tai-textarea"
              placeholder="Message Toosii AI…"
              value={input}
              rows={1}
              onChange={e => { setInput(e.target.value); setError('') }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
              }}
              disabled={loading}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="tai-send-btn"
              aria-label="Send"
            >
              {loading ? <div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> : '↑'}
            </button>
          </div>
          <p className="tai-disclaimer">Toosii AI can make mistakes. Verify important information.</p>
        </div>
      </div>
    </Layout>
  )
}
