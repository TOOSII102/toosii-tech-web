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

const STORAGE_KEY = 'toosii-ai-sessions'
const MAX_SESSIONS = 20

function getSessions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveSessions(sessions) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS))) } catch {}
}
function saveCurrentChat(messages) {
  if (!messages.length) return
  const sessions = getSessions()
  const firstUser = messages.find(m => m.role === 'user')
  const title = firstUser ? firstUser.text.slice(0, 60) : 'Chat'
  const id = Date.now().toString()
  saveSessions([{ id, title, ts: Date.now(), messages }, ...sessions.filter(s => s.title !== title)])
}
function fmtTime(ts) {
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`
  return d.toLocaleDateString()
}

export default function ToosiiAI() {
  const [messages, setMessages]     = useState([])
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [sessions, setSessions]     = useState([])
  const [attachedFile, setAttachedFile] = useState(null)
  const bottomRef  = useRef()
  const inputRef   = useRef()
  const fileRef    = useRef()

  useEffect(() => { setSessions(getSessions()) }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const send = async (text) => {
    let q = (text || input).trim()
    if (!q && !attachedFile) return
    if (loading) return

    // Append file content to prompt if attached
    let fileNote = ''
    if (attachedFile) {
      fileNote = attachedFile.content
        ? `\n\n[Attached file: ${attachedFile.name}]\n\`\`\`\n${attachedFile.content}\n\`\`\``
        : `\n\n[Attached file: ${attachedFile.name}]`
      if (!q) q = `Here is a file I uploaded: ${attachedFile.name}`
    }
    const fullPrompt = q + fileNote
    const displayMsg = attachedFile ? `${q}${attachedFile.content ? '' : ''}\n📎 ${attachedFile.name}` : q

    setMessages(prev => [...prev, { role: 'user', text: displayMsg }])
    setInput(''); setError(''); setAttachedFile(null)
    setLoading(true)

    try {
      const res = await fetch('/api/tools/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt }),
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

  const startNewChat = () => {
    if (messages.length > 0) {
      saveCurrentChat(messages)
      setSessions(getSessions())
    }
    setMessages([]); setError(''); setInput(''); setAttachedFile(null)
    setShowHistory(false)
  }

  const restoreSession = (session) => {
    if (messages.length > 0) saveCurrentChat(messages)
    setMessages(session.messages)
    setShowHistory(false)
    setError('')
  }

  const deleteSession = (id, e) => {
    e.stopPropagation()
    const updated = getSessions().filter(s => s.id !== id)
    saveSessions(updated)
    setSessions(updated)
  }

  const handleFile = (file) => {
    if (!file) return
    const isText = /^text\/|\.txt$|\.md$|\.js$|\.ts$|\.py$|\.json$|\.csv$|\.html$|\.css$/i.test(file.type + file.name)
    if (isText) {
      const reader = new FileReader()
      reader.onload = (e) => setAttachedFile({ name: file.name, content: e.target.result.slice(0, 8000) })
      reader.readAsText(file)
    } else {
      setAttachedFile({ name: file.name, content: null })
    }
  }

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
              <div className="tai-logo-sub">Powered by Toosii Tech · Always free</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => { setShowHistory(h => !h); setSessions(getSessions()) }}
              className="tai-clear-btn"
              title="Recent chats"
            >
              🕐 History {sessions.length > 0 && <span className="tai-history-count">{sessions.length}</span>}
            </button>
            <button onClick={startNewChat} className="tai-clear-btn">+ New chat</button>
          </div>
        </div>

        {/* History panel */}
        {showHistory && (
          <div className="tai-history-panel">
            <div className="tai-history-header">
              <span>Recent Chats</span>
              {sessions.length > 0 && (
                <button className="tai-history-clear-all" onClick={() => { saveSessions([]); setSessions([]) }}>
                  Clear all
                </button>
              )}
            </div>
            {sessions.length === 0 ? (
              <div className="tai-history-empty">No recent chats yet. Start a conversation!</div>
            ) : (
              sessions.map(s => (
                <div key={s.id} className="tai-history-item" onClick={() => restoreSession(s)}>
                  <div className="tai-history-title">{s.title}</div>
                  <div className="tai-history-meta">
                    <span>{fmtTime(s.ts)}</span>
                    <span>·</span>
                    <span>{s.messages.length} messages</span>
                  </div>
                  <button className="tai-history-del" onClick={(e) => deleteSession(s.id, e)} title="Delete">✕</button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Chat area */}
        <div className="tai-body" onClick={() => showHistory && setShowHistory(false)}>
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
              {error && <div className="error-box" style={{ margin: '0.5rem 0' }}>{error}</div>}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="tai-input-area">
          {attachedFile && (
            <div className="tai-file-preview">
              <span>📎 {attachedFile.name}</span>
              {attachedFile.content && <span className="tai-file-size">{attachedFile.content.length} chars</span>}
              <button onClick={() => setAttachedFile(null)} className="tai-file-remove">✕</button>
            </div>
          )}
          <div className="tai-input-box">
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            <button
              className="tai-attach-btn"
              onClick={() => fileRef.current?.click()}
              title="Attach a file"
              disabled={loading}
            >
              📎
            </button>
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
              disabled={loading || (!input.trim() && !attachedFile)}
              className="tai-send-btn"
              aria-label="Send"
            >
              {loading
                ? <div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                : '↑'}
            </button>
          </div>
          <p className="tai-disclaimer">Toosii AI can make mistakes. Verify important information.</p>
        </div>
      </div>
    </Layout>
  )
}
