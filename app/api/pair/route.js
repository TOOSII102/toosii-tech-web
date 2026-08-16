import { NextResponse } from 'next/server'

const SESSION_API = 'https://toosii-xd-session-generator-woyo.onrender.com'

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
    const res = await fetch(`${SESSION_API}/pair?number=${cleaned}`, {
      signal: AbortSignal.timeout(30000)
    })

    const text = await res.text()

    let data
    try {
      data = JSON.parse(text)
    } catch {
      if (text && text.trim().length > 6) {
        return NextResponse.json({ session_id: text.trim() })
      }
      return NextResponse.json({ error: 'Invalid response from session server' }, { status: 500 })
    }

    const sessionId = data.session_id || data.code || data.data || data.result || data.pair_code
    if (sessionId) {
      return NextResponse.json({ session_id: sessionId })
    }

    return NextResponse.json({ error: data.message || data.error || 'Failed to generate session. Try again.' }, { status: 500 })
  } catch (err) {
    return NextResponse.json({ error: 'Session server timed out. It may be waking up — wait 30 seconds and try again.' }, { status: 500 })
  }
}
