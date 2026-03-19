import { NextResponse } from 'next/server'

const EP = 'https://eliteprotech-apis.zone.id'

export async function POST(req) {
  try {
    const { prompt } = await req.json()
    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Please enter a message.' }, { status: 400 })
    }

    const q = prompt.trim()

    // Primary: ChatGPT
    try {
      const r1 = await fetch(`${EP}/chatgpt?prompt=${encodeURIComponent(q)}`, {
        signal: AbortSignal.timeout(20000),
      })
      if (r1.ok) {
        const d1 = await r1.json()
        if (d1.success && d1.response) return NextResponse.json({ reply: d1.response, model: 'ChatGPT' })
      }
    } catch (_) {}

    // Fallback 1: Gemini
    try {
      const r2 = await fetch(`${EP}/gemini?prompt=${encodeURIComponent(q)}`, {
        signal: AbortSignal.timeout(20000),
      })
      if (r2.ok) {
        const d2 = await r2.json()
        if (d2.success && d2.text) return NextResponse.json({ reply: d2.text, model: 'Gemini' })
      }
    } catch (_) {}

    // Fallback 2: Copilot
    const r3 = await fetch(`${EP}/copilot?q=${encodeURIComponent(q)}`, {
      signal: AbortSignal.timeout(20000),
    })
    if (!r3.ok) throw new Error(`upstream ${r3.status}`)
    const d3 = await r3.json()
    if (d3.success && d3.text) return NextResponse.json({ reply: d3.text, model: 'Copilot' })

    return NextResponse.json({ error: 'No response from AI. Please try again.' }, { status: 502 })
  } catch (e) {
    console.error('[toosii-ai]', e.message)
    return NextResponse.json({ error: 'Request failed. Try again later.' }, { status: 500 })
  }
}
