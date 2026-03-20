import { NextResponse } from 'next/server'

const EP = 'https://eliteprotech-apis.zone.id'

export async function GET() {
  try {
    const ep = await fetch(`${EP}/tempemail`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(15000),
    }).then(r => r.json())

    if (!ep.success || !ep.email) {
      return NextResponse.json({ error: 'Failed to generate email. Please try again.' }, { status: 502 })
    }

    return NextResponse.json({ email: ep.email })
  } catch (e) {
    return NextResponse.json({ error: 'Service unavailable. Please try again.' }, { status: 500 })
  }
}
