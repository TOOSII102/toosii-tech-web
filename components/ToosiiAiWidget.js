'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const PROMPTS = ['Tell me a fun fact', 'Write a short poem', 'What is 2+2 and why?', 'Give me a motivational quote']

export default function ToosiiAiWidget() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hey! I\'m Toosii AI. Ask me anything — I\'m here to help 🤖' }
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    const q = (text || input).trim()
    if (!q || loading) return
    setMessages(p => [...p, { role: 'user', text: q }])
    setInput('')
    setLoading(true)
    try {
      const res  = await fetch('/api/tools/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q }),
      })
      const data = await res.json()
      setMessages(p => [...p, {
        role: 'bot',
        text: data.error ? '⚠️ ' + data.error : data.reply,
      }])
    } catch {
      setMessages(p => [...p, { role: 'bot', text: '⚠️ Network error. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tai-widget">
      {/* Widget header */}
      <div className="tai-widget-header">
        <div className="tai-widget-logo">
          <div className="tai-widget-icon">T</div>
          <div>
            <div className="tai-widget-name">Toosii AI</div>
            <div className="tai-widget-powered">Powered by Toosii Tech</div>
          </div>
        </div>
        <Link href="/tools/ai" className="tai-widget-open">Open full chat ↗</Link>
      </div>

      {/* Messages */}
      <div className="tai-widget-messages">
        {messages.map((m, i) => (
          <div key={i} className={`tai-widget-msg ${m.role}`}>
            {m.role === 'bot' && <div className="tai-widget-avatar">T</div>}
            <div className={`tai-widget-bubble ${m.role}`}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="tai-widget-msg bot">
            <div className="tai-widget-avatar">T</div>
            <div className="tai-widget-bubble bot tai-widget-typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="tai-widget-prompts">
        {PROMPTS.map((p, i) => (
          <button key={i} className="tai-widget-prompt" onClick={() => send(p)} disabled={loading}>{p}</button>
        ))}
      </div>

      {/* Input */}
      <div className="tai-widget-input-row">
        <input
          type="text"
          className="tai-widget-input"
          placeholder="Ask Toosii AI anything…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          disabled={loading}
        />
        <button
          className="tai-widget-send"
          onClick={() => send()}
          disabled={loading || !input.trim()}
        >
          {loading ? '…' : '↑'}
        </button>
      </div>
    </div>
  )
}
