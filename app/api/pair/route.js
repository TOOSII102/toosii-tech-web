import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const number = searchParams.get('number')

  if (!number) {
    return NextResponse.json({ error: 'Number is required' }, { status: 400 })
  }

  const cleaned = number.replace(/[^\d]/g, '')
  if (cleaned.length < 10) {
    return NextResponse.json({ error: 'Enter a valid number with country code (e.g. 254712345678)' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://giftedtech.web.id/api/session/pair?number=${cleaned}`, {
      signal: AbortSignal.timeout(20000)
    })
    const data = await res.json()

    if (data.status && (data.session_id || data.code)) {
      return NextResponse.json({ session_id: data.session_id || data.code })
    }

    return NextResponse.json({ error: data.message || 'Failed to generate session' }, { status: 500 })
  } catch (err) {
    return NextResponse.json({ error: 'Session generator timed out. Try again.' }, { status: 500 })
  }
}
