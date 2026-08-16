import { NextResponse } from 'next/server'

const EP = 'https://eliteprotech-apis.zone.id'

export async function POST(req) {
  try {
    const { topic } = await req.json()
    if (!topic?.trim()) {
      return NextResponse.json({ error: 'Please enter a story topic.' }, { status: 400 })
    }

    const res = await fetch(`${EP}/story?text=${encodeURIComponent(topic.trim())}`, {
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) throw new Error(`EliteProTech ${res.status}`)
    const data = await res.json()

    if (!data.success || !data.story) {
      return NextResponse.json({ error: 'Could not generate a story. Try a different topic.' }, { status: 502 })
    }

    return NextResponse.json({ story: data.story })
  } catch (e) {
    console.error('[story]', e.message)
    return NextResponse.json({ error: 'Story generation failed. Try again later.' }, { status: 500 })
  }
}
