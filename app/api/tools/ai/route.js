import { NextResponse } from 'next/server'

const EP = 'https://eliteprotech-apis.zone.id'

export async function POST(req) {
  try {
    const { prompt } = await req.json()
    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Please enter a prompt.' }, { status: 400 })
    }

    const q = prompt.trim()

    // Primary: Gemini
    try {
      const r1 = await fetch(`${EP}/gemini?prompt=${encodeURIComponent(q)}`, {
        signal: AbortSignal.timeout(25000),
      })
      if (r1.ok) {
        const d1 = await r1.json()
        if (d1.success && d1.text) return NextResponse.json({ reply: d1.text, source: 'Gemini' })
      }
    } catch (_) {}

    // Fallback: Copilot
    const r2 = await fetch(`${EP}/copilot?q=${encodeURIComponent(q)}`, {
      signal: AbortSignal.timeout(25000),
    })
    if (!r2.ok) throw new Error(`EliteProTech ${r2.status}`)
    const d2 = await r2.json()

    if (d2.success && d2.text) return NextResponse.json({ reply: d2.text, source: 'Copilot' })

    return NextResponse.json({ error: 'AI did not return a response. Try rephrasing your question.' }, { status: 502 })
  } catch (e) {
    console.error('[ai]', e.message)
    return NextResponse.json({ error: 'AI request failed. Try again later.' }, { status: 500 })
  }
}
