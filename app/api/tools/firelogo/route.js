import { NextResponse } from 'next/server'

const EP = 'https://eliteprotech-apis.zone.id'

export async function POST(req) {
  try {
    const { text } = await req.json()
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Please provide text to generate a logo.' }, { status: 400 })
    }
    if (text.trim().length > 20) {
      return NextResponse.json({ error: 'Text must be 20 characters or less.' }, { status: 400 })
    }

    const ep = await fetch(`${EP}/firelogo?text=${encodeURIComponent(text.trim())}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(20000),
    }).then(r => r.json())

    if (!ep.success || !ep.image) {
      return NextResponse.json({ error: 'Failed to generate logo. Please try different text.' }, { status: 502 })
    }

    return NextResponse.json({ image: ep.image, text: ep.text })
  } catch (e) {
    return NextResponse.json({ error: 'Service unavailable. Please try again.' }, { status: 500 })
  }
}
