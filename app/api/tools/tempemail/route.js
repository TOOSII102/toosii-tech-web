import { NextResponse } from 'next/server'

const EP = 'https://eliteprotech-apis.zone.id'

async function fetchOne() {
  const ep = await fetch(`${EP}/tempemail`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(15000),
  }).then(r => r.json())
  if (!ep.success || !ep.email) throw new Error('No email returned')
  return ep.email
}

export async function GET(request) {
  try {
    const count = Math.min(parseInt(new URL(request.url).searchParams.get('count') || '1', 10), 5)
    const results = await Promise.allSettled(Array.from({ length: count }, () => fetchOne()))
    const emails = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)
      .filter((e, i, a) => a.indexOf(e) === i)

    if (emails.length === 0) {
      return NextResponse.json({ error: 'Failed to generate email. Please try again.' }, { status: 502 })
    }

    return NextResponse.json({ email: emails[0], emails })
  } catch (e) {
    return NextResponse.json({ error: 'Service unavailable. Please try again.' }, { status: 500 })
  }
}
