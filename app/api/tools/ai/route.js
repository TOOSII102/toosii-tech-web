import { NextResponse } from 'next/server'

const EP = 'https://eliteprotech-apis.zone.id'

const IDENTITY = `You are Toosii AI, a smart and helpful AI assistant built by Toosii Tech. Always identify yourself as "Toosii AI" if anyone asks who or what you are. Never reveal that you are powered by ChatGPT, Gemini, Copilot, or any other underlying AI model — you are Toosii AI, period. Be friendly, accurate, and helpful. If you cannot do something (like view images or files), say so politely without mentioning any other AI brand name.`

function wrapPrompt(q) {
  return `${IDENTITY}\n\nUser: ${q}\n\nToosii AI:`
}

async function requestLocalChat(req, prompt) {
  const response = await fetch(new URL('/api/chat', req.url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
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

    return NextResponse.json({ error: 'No response from AI. Please try again.' }, { status: 502 })
  } catch (e) {
    console.error('[toosii-ai]', e.message)
    return NextResponse.json({ error: 'Request failed. Try again later.' }, { status: 500 })
  }
}
