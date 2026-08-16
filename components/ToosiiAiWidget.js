'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import './ToosiiAiWidget.css'

const PROMPTS = [
  'Tell me a fun fact',
  'Write a short poem',
  'Give me a motivational quote',
  'What can Toosii Tech do?',
]

export default function ToosiiAiWidget() {
  const [open, setOpen]       = useState(false)
  const [pulse, setPulse]     = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hey! I'm Toosii AI 🤖 Ask me anything — questions, code, stories, advice." }
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef     = useRef(null)
  const inputRef      = useRef(null)
  const historyPushed = useRef(false)

  /* Pulse the button after 6 s to grab attention */
  useEffect(() => {
    const t = setTimeout(() => setPulse(true), 6000)
    return () => clearTimeout(t)
  }, [])

  /* Scroll to latest message */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  /* Focus input when panel opens */
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [open])

  /* Push a history entry when panel opens so the device back button closes it */
  useEffect(() => {
    if (open) {
      history.pushState({ aiPanel: true }, '')
      historyPushed.current = true
    }
  }, [open])

  /* Intercept back button — close panel instead of navigating away */
  useEffect(() => {
    const handler = () => {
      if (!historyPushed.current) return
      historyPushed.current = false
      setOpen(false)
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  /* Close panel and clean up the history entry */
  const closePanel = () => {
    if (historyPushed.current) {
      historyPushed.current = false
      history.back()
    }
    setOpen(false)
  }

  /* Close on Escape key */
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') closePanel() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

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

  const toggle = () => {
    if (open) {
      closePanel()
    } else {
      setOpen(true)
      setPulse(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        className={`tai-fab${pulse && !open ? ' tai-fab--pulse' : ''}${open ? ' tai-fab--active' : ''}`}
        onClick={toggle}
        aria-label="Chat with Toosii AI"
        title="Chat with Toosii AI"
      >
        <span className="tai-fab-icon">{open ? '✕' : '🤖'}</span>
        {!open && <span className="tai-fab-label">Toosii AI</span>}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="tai-panel" role="dialog" aria-label="Toosii AI Chat">

          <div className="tai-panel-header">
            <div className="tai-panel-logo">
              <div className="tai-panel-avatar">T</div>
              <div>
                <div className="tai-panel-name">Toosii AI</div>
                <div className="tai-panel-sub">Ask me anything</div>
              </div>
            </div>
            <Link href="/tools/ai" className="tai-panel-open-link" onClick={closePanel}>
              Full chat ↗
            </Link>
          </div>

          <div className="tai-panel-messages">
            {messages.map((m, i) => (
              <div key={i} className={`tai-msg tai-msg--${m.role}`}>
                {m.role === 'bot' && <div className="tai-msg-avatar">T</div>}
                <div className={`tai-bubble tai-bubble--${m.role}`}>{m.text}</div>
              </div>
            ))}

            {loading && (
              <div className="tai-msg tai-msg--bot">
                <div className="tai-msg-avatar">T</div>
                <div className="tai-bubble tai-bubble--bot tai-bubble--typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="tai-prompts">
            {PROMPTS.map((p, i) => (
              <button
                key={i}
                className="tai-prompt-chip"
                onClick={() => send(p)}
                disabled={loading}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="tai-input-row">
            <input
              ref={inputRef}
              type="text"
              className="tai-input"
              placeholder="Type a message…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              disabled={loading}
            />
            <button
              className="tai-send-btn"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              {loading ? '…' : '↑'}
            </button>
          </div>

        </div>
      )}
    </>
  )
}
