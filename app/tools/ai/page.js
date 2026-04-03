'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Markdown renderer helpers ──────────────────────────────────────────────
function renderInline(text) {
  const hits = []
  let m; let k = 0
  const icRe = /`([^`]+)`/g
  while ((m = icRe.exec(text)) !== null)
    hits.push({ index: m.index, end: m.index + m[0].length, el: <code key={k++} className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-green-300 text-[0.85em]">{m[1]}</code> })
  const claimed = (idx) => hits.some(h => idx >= h.index && idx < h.end)
  const bRe = /\*\*(.+?)\*\*/g
  while ((m = bRe.exec(text)) !== null)
    if (!claimed(m.index)) hits.push({ index: m.index, end: m.index + m[0].length, el: <strong key={k++} className="font-semibold text-white">{m[1]}</strong> })
  const iRe = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g
  while ((m = iRe.exec(text)) !== null)
    if (!claimed(m.index)) hits.push({ index: m.index, end: m.index + m[0].length, el: <em key={k++} className="italic">{m[1]}</em> })
  hits.sort((a, b) => a.index - b.index)
  const out = []; let last = 0
  for (const h of hits) { if (h.index > last) out.push(text.slice(last, h.index)); out.push(h.el); last = h.end }
  if (last < text.length) out.push(text.slice(last))
  return out.length ? out : [text]
}

function renderTextBlock(text, blockKey) {
  const lines = text.split('\n')
  const elements = []
  let i = 0, k = 0
  const hCls = { 1: 'text-xl font-bold mt-4 mb-1 text-white', 2: 'text-lg font-bold mt-3 mb-1 text-white', 3: 'text-base font-semibold mt-2 mb-0.5 text-white', 4: 'text-sm font-semibold mt-2 mb-0.5 text-white/70' }
  while (i < lines.length) {
    const line = lines[i]
    if (/^[-*_]{3,}$/.test(line.trim())) { elements.push(<hr key={k++} className="my-3 border-white/10" />); i++; continue }
    const hm = line.match(/^(#{1,4})\s+(.+)$/)
    if (hm) { const level = hm[1].length; elements.push(<div key={k++} className={hCls[level] || hCls[4]}>{renderInline(hm[2])}</div>); i++; continue }
    if (/^[-*+]\s/.test(line)) {
      const items = []
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) { items.push(lines[i].replace(/^[-*+]\s/, '')); i++ }
      elements.push(<ul key={k++} className="list-disc list-outside ml-5 my-1 space-y-0.5">{items.map((it, j) => <li key={j} className="leading-relaxed">{renderInline(it)}</li>)}</ul>)
      continue
    }
    if (/^\d+\.\s/.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s/, '')); i++ }
      elements.push(<ol key={k++} className="list-decimal list-outside ml-5 my-1 space-y-0.5">{items.map((it, j) => <li key={j} className="leading-relaxed">{renderInline(it)}</li>)}</ol>)
      continue
    }
    if (line.startsWith('> ')) { elements.push(<blockquote key={k++} className="border-l-2 border-green-400/40 pl-3 my-1 text-white/50 italic leading-relaxed">{renderInline(line.slice(2))}</blockquote>); i++; continue }
    if (line.trim() === '') { elements.push(<div key={k++} className="h-2" />); i++; continue }
    const para = []
    while (i < lines.length && lines[i].trim() !== '' && !/^#{1,4}\s/.test(lines[i]) && !/^[-*+]\s/.test(lines[i]) && !/^\d+\.\s/.test(lines[i]) && !lines[i].startsWith('> ') && !/^[-*_]{3,}$/.test(lines[i].trim())) { para.push(lines[i]); i++ }
    if (para.length > 0) elements.push(<div key={k++} className="leading-relaxed">{renderInline(para.join('\n'))}</div>)
  }
  return <div key={blockKey}>{elements}</div>
}

function renderContent(content) {
  const parts = []
  const re = /```(\w*)\n?([\s\S]*?)```/g
  let last = 0, m, k = 0
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) parts.push(renderTextBlock(content.slice(last, m.index), k++))
    const code = m[2].trimEnd()
    parts.push(
      <div key={k++} className="my-3 rounded-lg overflow-hidden border border-white/10">
        <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 text-xs text-white/40 font-mono">
          <span>{m[1] || 'code'}</span>
          <CopyButton text={code} />
        </div>
        <pre className="p-4 overflow-x-auto bg-black/30 text-sm font-mono text-green-300 leading-relaxed"><code>{code}</code></pre>
      </div>
    )
    last = m.index + m[0].length
  }
  if (last < content.length) parts.push(renderTextBlock(content.slice(last), k++))
  return <>{parts}</>
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
      } else {
        const el = document.createElement('textarea'); el.value = text; el.style.cssText = 'position:fixed;opacity:0'
        document.body.appendChild(el); el.select()
        try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
        document.body.removeChild(el)
      }
    }} className="hover:text-white/70 transition-colors">
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

// ─── Constants ───────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = 'You are Toosii, an expert coding assistant. You write clean, efficient code, explain clearly, and help debug any problem. Format code in markdown code blocks with the language specified.'

function buildZipContext(zipName, files) {
  const lines = [`The user has attached a zip archive: **${zipName}**\nIt contains ${files.length} file(s):\n`]
  for (const f of files) {
    const ext = f.path.split('.').pop() || ''
    lines.push(`\`\`\`${ext}\n// File: ${f.path}${f.truncated ? ' (truncated)' : ''}\n${f.content}\n\`\`\``)
  }
  return lines.join('\n')
}

const VISION_MODELS_CLIENT = new Set(['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'grok-2-vision-1212', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'])
const VISION_MODEL_PRIORITY_CLIENT = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gpt-4o-mini', 'gpt-4o', 'claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022', 'grok-2-vision-1212']

// ─── Main component ──────────────────────────────────────────────────────────
export default function ToosiiAI() {
  const [messages, setMessages]         = useState([])
  const [input, setInput]               = useState('')
  const [streaming, setStreaming]       = useState(false)
  const [models, setModels]             = useState([])
  const [model, setModel]               = useState(() => { try { return localStorage.getItem('claw_model') ?? '' } catch { return '' } })
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [conversations, setConversations] = useState(() => { try { const s = localStorage.getItem('claw_history'); return s ? JSON.parse(s) : [] } catch { return [] } })
  const [activeConvId, setActiveConvId] = useState(null)
  const [zipFiles, setZipFiles]         = useState([])
  const [zipName, setZipName]           = useState('')
  const [zipSkipped, setZipSkipped]     = useState([])
  const [uploadingZip, setUploadingZip] = useState(false)
  const [zipError, setZipError]         = useState('')
  const [isDragging, setIsDragging]     = useState(false)
  const [attachedImage, setAttachedImage] = useState(null)
  const [isListening, setIsListening]   = useState(false)

  const bottomRef     = useRef(null)
  const textareaRef   = useRef(null)
  const abortRef      = useRef(null)
  const fileInputRef  = useRef(null)
  const cameraInputRef = useRef(null)
  const recognitionRef = useRef(null)
  const streamingRef  = useRef(false)

  // Load models
  useEffect(() => {
    fetch('/api/models').then(r => r.json()).then(d => {
      if (d.models?.length) {
        setModels(d.models)
        try {
          const saved = localStorage.getItem('claw_model')
          setModel(saved && d.models.some(m => m.id === saved) ? saved : d.models[0].id)
        } catch { setModel(d.models[0].id) }
      }
    }).catch(() => {})
  }, [])

  useEffect(() => { try { if (model) localStorage.setItem('claw_model', model) } catch {} }, [model])

  useEffect(() => {
    try {
      localStorage.setItem('claw_history', JSON.stringify(conversations.map(c => ({
        ...c, messages: c.messages.map(m => ({ ...m, imageBase64: undefined, imageMimeType: undefined, imageUrl: undefined, pending: undefined }))
      }))))
    } catch {}
  }, [conversations])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  useEffect(() => {
    return () => { abortRef.current?.abort(); recognitionRef.current?.stop() }
  }, [])

  const clearZip = () => {
    setZipFiles([]); setZipName(''); setZipSkipped([]); setZipError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleZipUpload = async (file) => {
    if (!file.name.endsWith('.zip')) { setZipError('Only .zip files are supported'); return }
    setUploadingZip(true); setZipError(''); setZipFiles([]); setZipName(file.name)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/extract-zip', { method: 'POST', body: fd })
      if (!res.ok) { const e = await res.json().catch(() => ({ error: 'Failed' })); throw new Error(e.error) }
      const data = await res.json()
      setZipFiles(data.files ?? []); setZipSkipped(data.skipped ?? [])
    } catch (err) { setZipError(err?.message ?? 'Failed to extract zip'); setZipName('') }
    finally { setUploadingZip(false) }
  }

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false) }
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false)
    const file = Array.from(e.dataTransfer.files).find(f => f.name.endsWith('.zip'))
    if (file) handleZipUpload(file); else setZipError('Please drop a .zip file')
  }

  const saveCurrentConversation = useCallback((msgs) => {
    if (msgs.length === 0) return
    const firstUserMsg = msgs.find(m => m.role === 'user')
    const rawTitle = firstUserMsg?.content ?? ''
    const title = rawTitle.length > 40 ? rawTitle.slice(0, 40) + '…' : rawTitle || 'New chat'
    const lean = msgs.map(m => ({ ...m, imageBase64: undefined, imageMimeType: undefined, imageUrl: undefined, pending: undefined }))
    if (activeConvId) {
      setConversations(p => p.map(c => c.id === activeConvId ? { ...c, title, messages: lean } : c))
    } else {
      const newId = crypto.randomUUID()
      setConversations(p => [{ id: newId, title, messages: lean }, ...p])
      setActiveConvId(newId)
    }
  }, [activeConvId])

  const newConversation = useCallback(() => {
    saveCurrentConversation(messages)
    setMessages([]); setActiveConvId(null); setInput(''); clearZip(); setAttachedImage(null)
  }, [messages, saveCurrentConversation])

  const deleteConversation = useCallback((e, id) => {
    e.stopPropagation()
    setConversations(p => p.filter(c => c.id !== id))
    if (activeConvId === id) { setMessages([]); setActiveConvId(null) }
  }, [activeConvId])

  const clearAllConversations = useCallback(() => {
    setConversations([]); setMessages([]); setActiveConvId(null)
  }, [])

  const sendMessage = useCallback(async () => {
    const text = input.trim() || (zipFiles.length > 0 ? 'Please analyze this codebase and summarize what you find.' : (attachedImage ? 'Describe this image.' : ''))
    if ((!text && zipFiles.length === 0 && !attachedImage) || streaming) return
    const displayText = zipFiles.length > 0 ? `[${zipName}] ${text}` : text
    const imageSnap = attachedImage
    const userMsg = { id: crypto.randomUUID(), role: 'user', content: displayText, ...(imageSnap ? { imageUrl: imageSnap.dataUrl, imageBase64: imageSnap.base64, imageMimeType: imageSnap.mimeType } : {}) }
    const assistantMsg = { id: crypto.randomUUID(), role: 'assistant', content: '', pending: true }
    setMessages(p => [...p, userMsg, assistantMsg]); setInput(''); setAttachedImage(null)
    const sysMessages = [{ role: 'system', content: SYSTEM_PROMPT }]
    if (zipFiles.length > 0) sysMessages.push({ role: 'system', content: buildZipContext(zipName, zipFiles) })
    const historyMsgs = messages.map(m => ({ role: m.role, content: m.content }))
    const allMessages = [...sysMessages, ...historyMsgs, { role: 'user', content: text, ...(imageSnap ? { imageBase64: imageSnap.base64, imageMimeType: imageSnap.mimeType } : {}) }]
    setStreaming(true)
    try {
      abortRef.current = new AbortController()
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: allMessages, model }), signal: abortRef.current.signal })
      if (!res.ok) {
        let errMsg = `HTTP ${res.status}`
        try { const e = await res.json(); if (e.error) errMsg = e.error } catch {}
        throw new Error(errMsg)
      }
      if (!res.body) throw new Error('No response body')
      const reader = res.body.getReader(); const decoder = new TextDecoder()
      let buffer = '', full = '', streamDone = false
      while (!streamDone) {
        const { done, value } = await reader.read(); if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n'); buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim(); if (!data) continue
          let p; try { p = JSON.parse(data) } catch { continue }
          if (p.done) { streamDone = true; break }
          if (p.error) throw new Error(p.error)
          if (p.modelSwitch) setModel(p.modelSwitch)
          if (p.content) { full += p.content; setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, content: full, pending: false } : m)) }
        }
      }
      clearZip()
    } catch (err) {
      if (err.name === 'AbortError') {
        setMessages(prev => { const msg = prev.find(m => m.id === assistantMsg.id); return msg && msg.content === '' ? prev.filter(m => m.id !== assistantMsg.id) : prev })
      } else {
        setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, content: '⚠️ Error: ' + (err?.message ?? 'something went wrong'), pending: false } : m))
      }
    } finally {
      setStreaming(false); abortRef.current = null
      setMessages(prev => prev.map(m => m.imageBase64 ? { ...m, imageBase64: undefined, imageMimeType: undefined } : m))
    }
  }, [input, messages, model, streaming, zipFiles, zipName, attachedImage])

  useEffect(() => {
    if (streaming) { streamingRef.current = true; return }
    if (streamingRef.current && messages.length > 0) { streamingRef.current = false; saveCurrentConversation(messages) }
  }, [streaming, messages.length])

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }

  const handleCameraCapture = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      setAttachedImage({ dataUrl, base64: dataUrl.split(',')[1], mimeType: file.type || 'image/jpeg' })
    }
    reader.readAsDataURL(file)
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    setModel(prev => {
      if (VISION_MODELS_CLIENT.has(prev)) return prev
      const best = VISION_MODEL_PRIORITY_CLIENT.find(id => models.some(m => m.id === id))
      if (best) { const label = models.find(m => m.id === best)?.label ?? best; setTimeout(() => alert(`Switched to ${label} for image support.`), 0) }
      return best || prev
    })
  }

  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Speech recognition is not supported in this browser. Try Chrome or Edge.'); return }
    if (isListening) { recognitionRef.current?.stop(); return }
    const rec = new SR()
    rec.continuous = false; rec.interimResults = false; rec.lang = 'en-US'
    rec.onresult = (ev) => { const t = ev.results[0][0].transcript; setInput(p => (p ? p + ' ' : '') + t) }
    rec.onend = () => setIsListening(false)
    rec.onerror = () => setIsListening(false)
    rec.start(); recognitionRef.current = rec; setIsListening(true)
  }

  const stopStream = () => { abortRef.current?.abort() }
  const hasZip = zipFiles.length > 0
  const groups = Array.from(new Set(models.map(m => m.group)))

  return (
    <div className="fixed inset-0 z-50 flex bg-[#0d0d0d] text-white overflow-hidden" style={{ fontFamily: "'Inter',system-ui,-apple-system,sans-serif" }}>
      <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleZipUpload(f) }} />
      <input ref={cameraInputRef} type="file" accept="image/*" className="hidden" onChange={handleCameraCapture} />

      {/* Sidebar */}
      <aside className={`flex flex-col bg-[#111] border-r border-white/[0.08] transition-all duration-200 ${sidebarOpen ? 'w-64 min-w-[256px]' : 'w-0 min-w-0 overflow-hidden'}`}>
        <div className="flex items-center px-4 pt-5 pb-3 shrink-0">
          <span className="font-semibold text-sm text-white/80 tracking-wide">Toosii</span>
        </div>
        <button onClick={newConversation} className="mx-3 mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 border border-white/10 hover:bg-white/5 transition-colors">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          New chat
        </button>
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-xs text-white/25 uppercase tracking-wider">Chats</span>
            {conversations.length > 0 && (
              <button onClick={clearAllConversations} className="text-[10px] text-white/25 hover:text-red-400 transition-colors">Clear all</button>
            )}
          </div>
          {conversations.map(c => (
            <div key={c.id} className={`group flex items-center rounded-lg transition-colors ${activeConvId === c.id ? 'bg-white/10' : 'hover:bg-white/5'}`}>
              <button onClick={() => { saveCurrentConversation(messages); setMessages(c.messages); setActiveConvId(c.id) }}
                className={`flex-1 text-left px-3 py-2 text-sm truncate ${activeConvId === c.id ? 'text-white' : 'text-white/50 group-hover:text-white/70'}`}>{c.title}</button>
              <button onClick={(e) => deleteConversation(e, c.id)} className="opacity-0 group-hover:opacity-100 p-1.5 pr-2 text-white/30 hover:text-red-400 transition-all shrink-0">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}
          {conversations.length === 0 && <p className="px-3 py-2 text-xs text-white/25">No saved chats yet</p>}
        </div>
        <div className="px-3 pb-4 pt-2 border-t border-white/[0.08] shrink-0">
          <label className="block text-xs text-white/40 mb-1.5 font-medium">Model</label>
          <select value={model} onChange={e => setModel(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/70 focus:outline-none focus:border-green-500/50">
            {groups.map(g => (
              <optgroup key={g} label={'── ' + g}>
                {models.filter(m => m.group === g).map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 relative" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        {isDragging && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0d0d0d]/90 border-2 border-dashed border-green-500/50 m-2 rounded-xl pointer-events-none">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p className="text-green-400 font-semibold">Drop your .zip file</p>
            <p className="text-white/30 text-sm mt-1">Toosii will read all your code files</p>
          </div>
        )}

        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08] shrink-0">
          <button onClick={() => setSidebarOpen(v => !v)} className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/50 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-white/70">{models.find(m => m.id === model)?.label ?? 'Toosii AI'}</span>
          </div>
          {hasZip && (
            <div className="flex items-center gap-1.5 ml-auto px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span className="truncate max-w-[120px]">{zipName}</span>
              <button onClick={clearZip} className="ml-1 hover:text-red-400 transition-colors">✕</button>
            </div>
          )}
          {zipError && <p className="ml-auto text-xs text-red-400">{zipError}</p>}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/20 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
              </div>
              <div className="text-center">
                <h1 className="text-xl font-semibold text-white/80 mb-1">Toosii AI</h1>
                <p className="text-sm text-white/35">Your no-limit AI coding assistant. Ask anything.</p>
              </div>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploadingZip}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-green-500/30 text-green-400/70 hover:border-green-500/60 hover:text-green-400 transition-colors text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {uploadingZip ? 'Extracting…' : 'Upload .zip or drag & drop'}
              </button>
              <div className="grid grid-cols-2 gap-2 mt-2 max-w-sm w-full">
                {['Explain async/await in JS', 'Write a Python web scraper', 'Debug my Rust code', "What's the best DB for this?"].map(s => (
                  <button key={s} onClick={() => setInput(s)} className="text-left px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-xs text-white/50 hover:text-white/70 transition-colors">{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                    </div>
                  )}
                  <div className={`max-w-[82%] ${msg.role === 'user' ? 'bg-white/[0.06] rounded-2xl rounded-tr-sm px-4 py-3' : 'text-white/80 text-sm leading-relaxed'}`}>
                    {msg.imageUrl && <img src={msg.imageUrl} alt="attached" className="max-w-xs rounded-lg mb-2 border border-white/10" />}
                    {msg.role === 'user'
                      ? <p className="text-sm text-white/80 whitespace-pre-wrap">{msg.content}</p>
                      : msg.pending
                        ? <div className="flex gap-1 py-1">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: i * 0.15 + 's' }} />)}</div>
                        : renderContent(msg.content)
                    }
                  </div>
                  {msg.role === 'user' && <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold text-white/40">U</div>}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="px-4 pb-4 pt-2 shrink-0">
          {attachedImage && (
            <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] w-fit">
              <img src={attachedImage.dataUrl} alt="preview" className="w-8 h-8 rounded object-cover" />
              <span className="text-xs text-white/50">Image attached</span>
              <button onClick={() => setAttachedImage(null)} className="text-white/30 hover:text-red-400 transition-colors text-xs ml-1">✕</button>
            </div>
          )}
          <div className="flex items-end gap-2 px-3 py-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] focus-within:border-white/20 transition-colors">
            {/* Zip upload */}
            <button onClick={() => fileInputRef.current?.click()} disabled={streaming || uploadingZip} title="Upload .zip codebase"
              className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${hasZip ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-white/30 hover:text-white/60 hover:bg-white/[0.08] disabled:opacity-40'}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </button>
            {/* Camera / image */}
            <button onClick={() => cameraInputRef.current?.click()} disabled={streaming} title="Attach image (vision)"
              className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${attachedImage ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-white/30 hover:text-white/60 hover:bg-white/[0.08] disabled:opacity-40'}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
            {/* Mic */}
            <button onClick={toggleVoice} disabled={streaming} title={isListening ? 'Stop listening' : 'Speak to type'}
              className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${isListening ? 'text-red-400 bg-red-500/10 border border-red-500/20 animate-pulse' : 'text-white/30 hover:text-white/60 hover:bg-white/[0.08] disabled:opacity-40'}`}>
              {isListening
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><path d="M15 9.34V5a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2"/><path d="M19 12a7 7 0 0 1-.33 2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              }
            </button>
            <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} rows={1} autoFocus
              placeholder={isListening ? 'Listening…' : hasZip ? `Ask about ${zipName}…` : 'Ask anything… (Shift+Enter for newline)'}
              className="flex-1 bg-transparent resize-none outline-none text-sm text-white/80 placeholder:text-white/25 leading-relaxed min-h-[24px] max-h-[200px]" />
            {streaming
              ? <button onClick={stopStream} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
                </button>
              : <button onClick={sendMessage} disabled={!input.trim() && !hasZip && !attachedImage} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-green-500 hover:bg-green-400 disabled:bg-white/10 disabled:text-white/25 text-black transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                </button>
            }
          </div>
          <p className="text-center text-xs text-white/20 mt-2">Powered by Groq · Grok · Gemini · Claude · OpenAI · No limits · .zip · Vision · Voice</p>
        </div>
      </div>
    </div>
  )
}
