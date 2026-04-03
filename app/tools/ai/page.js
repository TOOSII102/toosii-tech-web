'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import './toosii-ai.css'

// ── Markdown helpers ──────────────────────────────────────────────────────────
function renderInline(text) {
  const hits = []; let m; let k = 0
  const tryRe = (re, mkEl) => { re.lastIndex = 0; while ((m = re.exec(text)) !== null) mkEl(m) }
  tryRe(/`([^`]+)`/g, m => hits.push({ index: m.index, end: m.index + m[0].length, el: <code key={k++}>{m[1]}</code> }))
  const claimed = i => hits.some(h => i >= h.index && i < h.end)
  tryRe(/\*\*(.+?)\*\*/g, m => { if (!claimed(m.index)) hits.push({ index: m.index, end: m.index + m[0].length, el: <strong key={k++}>{m[1]}</strong> }) })
  // simple italic — avoid negative lookbehind for broader browser compat
  tryRe(/__(.+?)__/g, m => { if (!claimed(m.index)) hits.push({ index: m.index, end: m.index + m[0].length, el: <em key={k++}>{m[1]}</em> }) })
  hits.sort((a, b) => a.index - b.index)
  const out = []; let last = 0
  for (const h of hits) { if (h.index > last) out.push(text.slice(last, h.index)); out.push(h.el); last = h.end }
  if (last < text.length) out.push(text.slice(last))
  return out.length ? out : [text]
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(text) } catch { const el = Object.assign(document.createElement('textarea'), { value: text, style: 'position:fixed;opacity:0' }); document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el) }
    setCopied(true); setTimeout(() => setCopied(false), 1600)
  }
  return <button className="tai-code-copy" onClick={copy}>{copied ? '✓ Copied' : 'Copy'}</button>
}

function renderBlock(text, bk) {
  const lines = text.split('\n'); const els = []; let i = 0, k = 0
  while (i < lines.length) {
    const ln = lines[i]
    if (/^[-*_]{3,}$/.test(ln.trim())) { els.push(<hr key={k++} />); i++; continue }
    const hm = ln.match(/^(#{1,4})\s+(.+)$/)
    const hSz = ['1.15em','1.05em','0.97em','0.9em']
    if (hm) { const lv = hm[1].length - 1; els.push(<div key={k++} style={{ fontWeight: 700, fontSize: hSz[lv] || '0.9em', color: 'white', margin: '0.8em 0 0.3em' }}>{renderInline(hm[2])}</div>); i++; continue }
    if (/^[-*+]\s/.test(ln)) {
      const items = []; while (i < lines.length && /^[-*+]\s/.test(lines[i])) { items.push(lines[i].replace(/^[-*+]\s/, '')); i++ }
      els.push(<ul key={k++} style={{ paddingLeft: '1.3em', margin: '0.3em 0' }}>{items.map((it, j) => <li key={j} style={{ lineHeight: '1.6', marginBottom: '0.15em' }}>{renderInline(it)}</li>)}</ul>); continue
    }
    if (/^\d+\.\s/.test(ln)) {
      const items = []; while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s/, '')); i++ }
      els.push(<ol key={k++} style={{ paddingLeft: '1.3em', margin: '0.3em 0' }}>{items.map((it, j) => <li key={j} style={{ lineHeight: '1.6', marginBottom: '0.15em' }}>{renderInline(it)}</li>)}</ol>); continue
    }
    if (ln.startsWith('> ')) { els.push(<blockquote key={k++} style={{ borderLeft: '2px solid rgba(37,211,102,0.4)', paddingLeft: '0.75em', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', margin: '0.3em 0' }}>{renderInline(ln.slice(2))}</blockquote>); i++; continue }
    if (ln.trim() === '') { els.push(<div key={k++} style={{ height: '0.45em' }} />); i++; continue }
    const para = []
    while (i < lines.length && lines[i].trim() !== '' && !/^#{1,4}\s/.test(lines[i]) && !/^[-*+]\s/.test(lines[i]) && !/^\d+\.\s/.test(lines[i]) && !lines[i].startsWith('> ') && !/^[-*_]{3,}$/.test(lines[i].trim())) { para.push(lines[i]); i++ }
    if (para.length) els.push(<p key={k++} style={{ lineHeight: '1.65', margin: '0.25em 0' }}>{renderInline(para.join('\n'))}</p>)
  }
  return <div key={bk}>{els}</div>
}

function renderContent(content) {
  const parts = []; const re = /```(\w*)\n?([\s\S]*?)```/g
  let last = 0, m, k = 0
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) parts.push(renderBlock(content.slice(last, m.index), k++))
    const code = m[2].trimEnd()
    parts.push(
      <div key={k++} className="tai-code-wrap">
        <div className="tai-code-bar"><span>{m[1] || 'code'}</span><CopyButton text={code} /></div>
        <pre><code>{code}</code></pre>
      </div>
    )
    last = m.index + m[0].length
  }
  if (last < content.length) parts.push(renderBlock(content.slice(last), k++))
  return <div className="tai-md">{parts}</div>
}

// ── Constants ─────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = 'You are Toosii, an expert AI coding assistant built by Toosii Tech from Kenya. You write clean, efficient code, explain concepts clearly, and help debug any problem. Always format code in markdown fenced blocks with the language name. Be concise, helpful, and professional.'
const VISION_MODELS = new Set(['gpt-4o','gpt-4o-mini','claude-3-5-sonnet-20241022','claude-3-5-haiku-20241022','grok-2-vision-1212','gemini-2.0-flash','gemini-1.5-flash','gemini-1.5-pro'])
const VISION_PRIORITY = ['gemini-2.0-flash','gemini-1.5-flash','gemini-1.5-pro','gpt-4o-mini','gpt-4o','claude-3-5-haiku-20241022','claude-3-5-sonnet-20241022','grok-2-vision-1212']
const SUGGESTIONS = ['Explain async/await with examples','Write a Python REST API','Debug my JavaScript code','Best database for my app?']

function buildZipContext(zipName, files) {
  const header = `The user has uploaded a codebase zip file: **${zipName}** (${files.length} files). Analyze it and answer their questions about it.`
  const bodies = files.map(f => {
    const ext = f.path.split('.').pop() || 'txt'
    return `\`\`\`${ext}\n// ${f.path}${f.truncated ? ' (truncated)' : ''}\n${f.content}\n\`\`\``
  })
  return [header, ...bodies].join('\n\n')
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ToosiiAI() {
  // All state starts with SSR-safe defaults (no localStorage in initializers)
  const [hydrated, setHydrated]         = useState(false)
  const [messages, setMessages]         = useState([])
  const [input, setInput]               = useState('')
  const [streaming, setStreaming]       = useState(false)
  const [models, setModels]             = useState([])
  const [model, setModel]               = useState('llama-3.3-70b-versatile')
  const [modelsLoading, setModelsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen]   = useState(true)
  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [zipFiles, setZipFiles]         = useState([])
  const [zipName, setZipName]           = useState('')
  const [uploadingZip, setUploadingZip] = useState(false)
  const [zipError, setZipError]         = useState('')
  const [isDragging, setIsDragging]     = useState(false)
  const [attachedImage, setAttachedImage] = useState(null)
  const [isListening, setIsListening]   = useState(false)
  const [toastMsg, setToastMsg]         = useState('')

  const bottomRef      = useRef(null)
  const textareaRef    = useRef(null)
  const abortRef       = useRef(null)
  const fileInputRef   = useRef(null)
  const cameraRef      = useRef(null)
  const recognitionRef = useRef(null)
  const streamingRef   = useRef(false)

  // Show toast helper
  const toast = useCallback((msg, ms = 3000) => {
    setToastMsg(msg); setTimeout(() => setToastMsg(''), ms)
  }, [])

  // Hydrate from localStorage AFTER mount (avoids SSR mismatch)
  useEffect(() => {
    setHydrated(true)
    try {
      const savedModel = localStorage.getItem('tai_model')
      if (savedModel) setModel(savedModel)
      const savedConvs = localStorage.getItem('tai_history')
      if (savedConvs) setConversations(JSON.parse(savedConvs))
    } catch {}
    // On mobile, start sidebar closed; on desktop start open
    setSidebarOpen(window.innerWidth >= 640)
  }, [])

  // Load models
  useEffect(() => {
    fetch('/api/models').then(r => r.json()).then(d => {
      if (d.models?.length) {
        setModels(d.models)
        setModelsLoading(false)
        // Only update model if current model not in list
        setModel(prev => d.models.some(m => m.id === prev) ? prev : d.models[0].id)
      }
    }).catch(() => { setModelsLoading(false) })
  }, [])

  // Persist model choice
  useEffect(() => { if (hydrated && model) { try { localStorage.setItem('tai_model', model) } catch {} } }, [hydrated, model])

  // Persist conversations (lean - no image data)
  useEffect(() => {
    if (!hydrated) return
    try {
      const lean = conversations.map(c => ({ ...c, messages: c.messages.map(m => ({ role: m.role, content: m.content })) }))
      localStorage.setItem('tai_history', JSON.stringify(lean))
    } catch {}
  }, [hydrated, conversations])

  // Auto-scroll to latest message
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current; if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 180) + 'px'
  }, [input])

  // Cleanup on unmount
  useEffect(() => () => { abortRef.current?.abort(); recognitionRef.current?.stop() }, [])

  const clearZip = useCallback(() => {
    setZipFiles([]); setZipName(''); setZipError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleZipUpload = useCallback(async (file) => {
    if (!file.name.endsWith('.zip')) { toast('Only .zip files are supported'); return }
    setUploadingZip(true); setZipError(''); setZipFiles([]); setZipName(file.name)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/extract-zip', { method: 'POST', body: fd })
      if (!res.ok) { const e = await res.json().catch(() => ({ error: 'Failed' })); throw new Error(e.error || 'Upload failed') }
      const data = await res.json()
      setZipFiles(data.files ?? [])
      toast(`Loaded ${data.files?.length ?? 0} files from ${file.name}`)
    } catch (err) { setZipError(err?.message ?? 'Failed to extract zip'); setZipName('') }
    finally { setUploadingZip(false) }
  }, [toast])

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false) }
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false)
    const file = Array.from(e.dataTransfer.files).find(f => f.name.endsWith('.zip'))
    if (file) handleZipUpload(file); else toast('Please drop a .zip file')
  }

  const saveConversation = useCallback((msgs, convId) => {
    if (!msgs.length) return
    const first = msgs.find(m => m.role === 'user')?.content ?? ''
    const title = first.length > 50 ? first.slice(0, 50) + '…' : first || 'New chat'
    const lean = msgs.map(m => ({ role: m.role, content: m.content }))
    if (convId) {
      setConversations(p => p.map(c => c.id === convId ? { ...c, title, messages: lean, updatedAt: Date.now() } : c))
    } else {
      const id = Date.now().toString(36)
      setActiveConvId(id)
      setConversations(p => [{ id, title, messages: lean, updatedAt: Date.now() }, ...p.slice(0, 49)])
      return id
    }
  }, [])

  const newChat = useCallback(() => {
    if (messages.length) saveConversation(messages, activeConvId)
    setMessages([]); setActiveConvId(null); setInput(''); clearZip(); setAttachedImage(null)
  }, [messages, activeConvId, saveConversation, clearZip])

  const loadConversation = useCallback((conv) => {
    if (messages.length) saveConversation(messages, activeConvId)
    setMessages(conv.messages.map(m => ({ ...m, id: Math.random().toString(36) })))
    setActiveConvId(conv.id)
    if (window.innerWidth < 640) setSidebarOpen(false)
  }, [messages, activeConvId, saveConversation])

  const deleteConv = useCallback((e, id) => {
    e.stopPropagation()
    setConversations(p => p.filter(c => c.id !== id))
    if (activeConvId === id) { setMessages([]); setActiveConvId(null) }
  }, [activeConvId])

  const sendMessage = useCallback(async (overrideText) => {
    const text = (overrideText ?? input).trim()
    const hasContent = text || zipFiles.length || attachedImage
    if (!hasContent || streaming) return

    const finalText = text || (zipFiles.length ? `Analyze the ${zipName} codebase.` : 'Describe this image.')
    const imageSnap = attachedImage
    const displayText = zipFiles.length && !text ? finalText : (zipFiles.length ? `[${zipName}] ${text}` : text)

    const userMsg  = { id: Math.random().toString(36), role: 'user',      content: displayText, ...(imageSnap ? { imageUrl: imageSnap.dataUrl } : {}) }
    const aiMsg    = { id: Math.random().toString(36), role: 'assistant',  content: '', pending: true }

    setMessages(p => [...p, userMsg, aiMsg])
    setInput(''); setAttachedImage(null); setStreaming(true)

    const systemMsgs = [{ role: 'system', content: SYSTEM_PROMPT }]
    if (zipFiles.length) systemMsgs.push({ role: 'system', content: buildZipContext(zipName, zipFiles) })
    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content, ...(m.imageBase64 ? { imageBase64: m.imageBase64, imageMimeType: m.imageMimeType } : {}) }))
    const payload = [...systemMsgs, ...history.map(m => m.role === 'user' && imageSnap ? { ...m, imageBase64: imageSnap.base64, imageMimeType: imageSnap.mimeType } : m)]

    try {
      abortRef.current = new AbortController()
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payload, model }),
        signal: abortRef.current.signal
      })
      if (!res.ok) { let e = 'HTTP ' + res.status; try { const j = await res.json(); if (j.error) e = j.error } catch {}; throw new Error(e) }
      if (!res.body) throw new Error('No response body — try again')

      const reader = res.body.getReader(); const dec = new TextDecoder()
      let buf = '', full = '', done = false
      while (!done) {
        const { done: d, value } = await reader.read(); if (d) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop() ?? ''
        for (const ln of lines) {
          if (!ln.startsWith('data: ')) continue
          const raw = ln.slice(6).trim(); if (!raw) continue
          let p; try { p = JSON.parse(raw) } catch { continue }
          if (p.done) { done = true; break }
          if (p.error) throw new Error(p.error)
          if (p.modelSwitch) { setModel(p.modelSwitch); toast('Switched to ' + p.modelSwitch) }
          if (p.content) { full += p.content; setMessages(prev => prev.map(m => m.id === aiMsg.id ? { ...m, content: full, pending: false } : m)) }
        }
      }
      clearZip()
      // Save conversation
      const finalMsgs = [...messages, userMsg, { ...aiMsg, content: full, pending: false }]
      const newConvId = activeConvId ?? saveConversation(finalMsgs, null)
      if (activeConvId) saveConversation(finalMsgs, activeConvId)
    } catch (err) {
      if (err.name === 'AbortError') {
        setMessages(prev => { const m = prev.find(x => x.id === aiMsg.id); return m?.content === '' ? prev.filter(x => x.id !== aiMsg.id) : prev })
      } else {
        setMessages(prev => prev.map(m => m.id === aiMsg.id ? { ...m, content: '⚠️ ' + (err?.message ?? 'Something went wrong. Please try again.'), pending: false } : m))
      }
    } finally {
      setStreaming(false); abortRef.current = null
    }
  }, [input, messages, model, streaming, zipFiles, zipName, attachedImage, activeConvId, saveConversation, clearZip, toast])

  const handleKey = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }, [sendMessage])

  const handleImage = useCallback((e) => {
    const file = e.target.files?.[0]; if (!file) return
    if (!file.type.startsWith('image/')) { toast('Please select an image file'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      setAttachedImage({ dataUrl, base64: dataUrl.split(',')[1], mimeType: file.type })
      // Auto-switch to a vision model if current model doesn't support vision
      if (!VISION_MODELS.has(model)) {
        const best = VISION_PRIORITY.find(id => models.some(m => m.id === id))
        if (best) { setModel(best); toast('Switched to ' + best + ' for vision') }
      }
    }
    reader.readAsDataURL(file)
    if (cameraRef.current) cameraRef.current.value = ''
  }, [model, models, toast])

  const toggleVoice = useCallback(() => {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
    if (!SR) { toast('Speech recognition not supported. Use Chrome or Edge.'); return }
    if (isListening) { recognitionRef.current?.stop(); return }
    const rec = new SR()
    rec.continuous = false; rec.interimResults = false; rec.lang = 'en-US'
    rec.onresult = (ev) => { const t = ev.results[0][0].transcript; setInput(p => (p ? p + ' ' : '') + t) }
    rec.onend = () => setIsListening(false)
    rec.onerror = (e) => { setIsListening(false); if (e.error !== 'no-speech') toast('Voice error: ' + e.error) }
    rec.start(); recognitionRef.current = rec; setIsListening(true)
  }, [isListening, toast])

  const hasZip = zipFiles.length > 0
  const groups = [...new Set(models.map(m => m.group))]
  const currentModel = models.find(m => m.id === model)
  const headerLabel = currentModel?.label ?? (modelsLoading ? 'Loading models…' : 'Toosii AI')

  return (
    <div className="tai">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept=".zip" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleZipUpload(f); e.target.value = '' }} />
      <input ref={cameraRef}    type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />

      {/* Toast */}
      {toastMsg && <div className="tai-toast">{toastMsg}</div>}

      {/* Sidebar overlay on mobile */}
      {sidebarOpen && <div className="tai-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`tai-sidebar${sidebarOpen ? '' : ' collapsed'}`}>
        <div className="tai-sidebar-head">
          <span className="tai-sidebar-brand">⚡ Toosii AI</span>
        </div>

        <button className="tai-new-chat-btn" onClick={newChat}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>
          New chat
        </button>

        <div className="tai-conv-area">
          <div className="tai-conv-label">
            <span>History</span>
            {conversations.length > 0 && (
              <button className="tai-conv-clear-all" onClick={() => { if (confirm('Clear all chat history?')) { setConversations([]); setMessages([]); setActiveConvId(null) } }}>Clear all</button>
            )}
          </div>
          {conversations.length === 0 && <p className="tai-conv-empty">Start a conversation to save history</p>}
          {conversations.map(c => (
            <div key={c.id} className={`tai-conv-item${activeConvId === c.id ? ' active' : ''}`}>
              <button className="tai-conv-title" onClick={() => loadConversation(c)}>{c.title}</button>
              <button className="tai-conv-del" onClick={e => deleteConv(e, c.id)} title="Delete chat">✕</button>
            </div>
          ))}
        </div>

        <div className="tai-sidebar-footer">
          <label className="tai-model-label">AI Model</label>
          {modelsLoading ? (
            <div className="tai-model-loading">Loading models…</div>
          ) : models.length === 0 ? (
            <div className="tai-model-loading" style={{ color: '#fca5a5' }}>No models available</div>
          ) : (
            <select className="tai-model-select" value={model} onChange={e => setModel(e.target.value)}>
              {groups.map(g => (
                <optgroup key={g} label={g}>
                  {models.filter(m => m.group === g).map(m => <option key={m.id} value={m.id}>{m.label}{VISION_MODELS.has(m.id) ? ' 👁' : ''}</option>)}
                </optgroup>
              ))}
            </select>
          )}
          <p className="tai-sidebar-hint">👁 = supports images</p>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="tai-main" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>

        {/* Drag overlay */}
        {isDragging && (
          <div className="tai-drag-overlay">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <p>Drop your .zip file here</p>
            <small>Toosii will read and analyze your codebase</small>
          </div>
        )}

        {/* Header */}
        <header className="tai-header">
          <button className="tai-menu-btn" onClick={() => setSidebarOpen(v => !v)} title="Toggle sidebar" aria-label="Toggle sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>

          <div className="tai-header-model">
            <span className="tai-status-dot" />
            <span className="tai-header-model-name">{headerLabel}</span>
          </div>

          {/* Zip badge */}
          {hasZip && (
            <div className="tai-zip-badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span className="tai-zip-name">{zipName}</span>
              <button className="tai-zip-remove" onClick={clearZip} title="Remove file">✕</button>
            </div>
          )}
          {zipError && <span className="tai-zip-error">{zipError}</span>}

          {/* Back to site */}
          <a href="/tools" className="tai-back-btn" title="Back to Tools">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Tools
          </a>
        </header>

        {/* Messages */}
        <div className="tai-messages">
          {messages.length === 0 ? (
            <div className="tai-welcome">
              <div className="tai-welcome-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              </div>
              <h2>Toosii AI</h2>
              <p>Free AI coding assistant — multi-model, real-time streaming, codebase analysis, vision & voice.</p>
              <button className="tai-upload-zip-btn" onClick={() => fileInputRef.current?.click()} disabled={uploadingZip}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                {uploadingZip ? 'Extracting…' : 'Analyze a codebase (.zip)'}
              </button>
              <div className="tai-suggestions">
                {SUGGESTIONS.map(s => (
                  <button key={s} className="tai-suggestion-btn" onClick={() => sendMessage(s)}>{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="tai-msg-list">
              {messages.map(msg => (
                <div key={msg.id} className={`tai-msg-row ${msg.role}`}>
                  {msg.role === 'assistant' && (
                    <div className="tai-avatar ai-avatar">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                    </div>
                  )}
                  <div className="tai-msg-bubble">
                    {msg.imageUrl && <img src={msg.imageUrl} alt="attached" className="tai-msg-img" />}
                    {msg.role === 'user'
                      ? <p className="tai-msg-text">{msg.content}</p>
                      : msg.pending
                        ? <div className="tai-dots"><div className="tai-dot"/><div className="tai-dot"/><div className="tai-dot"/></div>
                        : renderContent(msg.content)
                    }
                  </div>
                  {msg.role === 'user' && <div className="tai-avatar user-avatar">You</div>}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="tai-input-area">
          {attachedImage && (
            <div className="tai-image-preview">
              <img src={attachedImage.dataUrl} alt="preview" className="tai-image-thumb" />
              <span className="tai-image-label">Image ready</span>
              <button className="tai-image-remove" onClick={() => setAttachedImage(null)}>✕</button>
            </div>
          )}
          <div className="tai-input-box">
            <button className={`tai-icon-btn${hasZip ? ' active' : ''}`} onClick={() => fileInputRef.current?.click()} disabled={streaming || uploadingZip} title="Analyze codebase (.zip)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </button>
            <button className={`tai-icon-btn${attachedImage ? ' active' : ''}`} onClick={() => cameraRef.current?.click()} disabled={streaming} title="Attach image (vision)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
            <button className={`tai-icon-btn${isListening ? ' listening' : ''}`} onClick={toggleVoice} disabled={streaming} title={isListening ? 'Stop listening' : 'Voice input'}>
              {isListening
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><path d="M15 9.34V5a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              }
            </button>
            <textarea
              ref={textareaRef}
              className="tai-textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              placeholder={isListening ? 'Listening…' : hasZip ? `Ask about ${zipName}…` : attachedImage ? 'Ask about this image…' : 'Ask anything… (Shift+Enter for new line)'}
            />
            {streaming
              ? <button className="tai-stop-btn" onClick={() => abortRef.current?.abort()} title="Stop generating">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                </button>
              : <button className="tai-send-btn" onClick={() => sendMessage()} disabled={!input.trim() && !hasZip && !attachedImage} title="Send message">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
            }
          </div>
          <p className="tai-footer-note">Groq · Gemini · OpenAI · Claude · Grok — streaming · .zip analysis · vision · voice</p>
        </div>
      </div>
    </div>
  )
}
