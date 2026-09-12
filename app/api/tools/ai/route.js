import { NextResponse } from 'next/server'
import { partnerChat } from '../../../../lib/partnerApi'
import { hubChat } from '../../../../lib/apiHub'

const EP = 'https://eliteprotech-apis.zone.id'
const RBOTS_BASE = 'https://r-bots-free-apis.co08.art'
const RBOTS_ENDPOINTS = [
  { path: '/api/qwen', label: 'Toosii Qwen' },
  { path: '/api/deepseek-v3', label: 'Toosii DeepSeek V3' },
  { path: '/api/deepseek-r1', label: 'Toosii DeepSeek R1' },
  { path: '/api/gemini', label: 'Toosii Gemini' },
  { path: '/api/gptlogic', label: 'Toosii Logic', acceptsPrompt: true },
]

const IDENTITY = `You are Toosii AI, a smart and helpful AI assistant built by Toosii Tech. Always identify yourself as "Toosii AI" if anyone asks who or what you are. Never reveal that you are powered by ChatGPT, Gemini, Copilot, or any other underlying AI model — you are Toosii AI, period. Be friendly, accurate, and helpful. If you cannot do something (like view images or files), say so politely without mentioning any other AI brand name.`

function wrapPrompt(q) {
  return `${IDENTITY}\n\nUser: ${q}\n\nToosii AI:`
}

async function requestLocalChat(req, prompt) {
  const response = await fetch(new URL('/api/chat', req.url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'toosii-qwen',
      messages: [
        { role: 'system', content: IDENTITY },
        { role: 'user', content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(45000),
  })
  if (!response.ok) throw new Error(`Local chat ${response.status}`)

  const raw = await response.text()
  const reply = raw
    .split(/\r?\n/)
    .filter(line => line.startsWith('data: '))
    .map(line => {
      try { return JSON.parse(line.slice(6)).content || '' } catch { return '' }
    })
    .join('')
    .trim()

  if (!reply) throw new Error('Local chat returned no content')
  return reply
}

function extractReferenceText(payload) {
  if (typeof payload === 'string') return payload.trim()
  const candidates = [payload?.response, payload?.answer, payload?.result, payload?.message, payload?.data?.response, payload?.data?.answer, payload?.data?.result, payload?.data?.message]
  const value = candidates.find(item => typeof item === 'string' && item.trim())
  return value ? value.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<\/?think>/gi, '').replace(/\b(I\s*(?:am|'m|’m))\s+(?:gemini|qwen|deepseek(?:[- ]?(?:v3|r1))?|llama(?:[- ]?[0-9.]+)?|gpt)\b/gi, '$1 Toosii AI').replace(/\ba large language model built by (?:google|alibaba|deepseek|meta|openai)\b/gi, 'a professional AI assistant built by Toosii Tech').trim() : ''
}

async function requestRbots(endpoint, prompt) {
  const params = new URLSearchParams({ q: prompt.slice(0, 7200) })
  if (endpoint.acceptsPrompt) params.set('prompt', 'Answer as Toosii AI, built by Toosii Tech. Be concise and helpful.')
  const url = `${RBOTS_BASE}${endpoint.path}?${params.toString()}`
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(25000) })
  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.status === false) throw new Error(`${endpoint.label} ${response.status}`)
  const text = extractReferenceText(payload)
  if (!text) throw new Error(`${endpoint.label} returned no content`)
  return text
}

export async function POST(req) {
  try {
    const { prompt } = await req.json()
    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Please enter a message.' }, { status: 400 })
    }

    const q = prompt.trim()
    const wrapped = wrapPrompt(q)

    // Primary: use Toosii's working same-origin chat route.
    try {
      const reply = await requestLocalChat(req, q)
      return NextResponse.json({ reply, model: 'Toosii AI' })
    } catch (_) {}

    // Direct Toosii public AI fallbacks. They are tried in the order validated by live smoke tests.
    for (const endpoint of RBOTS_ENDPOINTS) {
      try {
        const reply = await requestRbots(endpoint, wrapped)
        return NextResponse.json({ reply, model: endpoint.label })
      } catch (_) {}
    }

    // Legacy provider fallbacks.
    try {
      const r1 = await fetch(`${EP}/chatgpt?prompt=${encodeURIComponent(wrapped)}`, {
        signal: AbortSignal.timeout(20000),
      })
      if (r1.ok) {
        const d1 = await r1.json()
        if (d1.success && d1.response) return NextResponse.json({ reply: d1.response, model: 'Toosii AI' })
      }
    } catch (_) {}

    // Fallback 1: source B
    try {
      const r2 = await fetch(`${EP}/gemini?prompt=${encodeURIComponent(wrapped)}`, {
        signal: AbortSignal.timeout(20000),
      })
      if (r2.ok) {
        const d2 = await r2.json()
        if (d2.success && d2.text) return NextResponse.json({ reply: d2.text, model: 'Toosii AI' })
      }
    } catch (_) {}

    // Fallback 2: source C
    try {
      const r3 = await fetch(`${EP}/copilot?q=${encodeURIComponent(wrapped)}`, {
        signal: AbortSignal.timeout(20000),
      })
      if (r3.ok) {
        const d3 = await r3.json()
        if (d3.success && d3.text) return NextResponse.json({ reply: d3.text, model: 'Toosii AI' })
      }
    } catch (_) {}

    // Fallback 3: Partner AI (Partner AI → GPT → Qwen → DeepSeek V3).
    try {
      const partner = await partnerChat(wrapped)
      if (partner?.reply) return NextResponse.json({ reply: partner.reply, model: 'Toosii AI' })
    } catch (_) {}

    // Fallback 4: API hub (GPT → DeepSeek → Qwen → Gemini).
    try {
      const hub = await hubChat(wrapped)
      if (hub?.reply) return NextResponse.json({ reply: hub.reply, model: 'Toosii AI' })
    } catch (_) {}

    return NextResponse.json({ error: 'No response from AI. Please try again.' }, { status: 502 })
  } catch (e) {
    console.error('[toosii-ai]', e.message)
    return NextResponse.json({ error: 'Request failed. Try again later.' }, { status: 500 })
  }
}
