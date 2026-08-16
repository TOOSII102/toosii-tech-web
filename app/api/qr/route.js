import { NextResponse } from 'next/server'

const SESSION_API = 'https://toosii-xd-session-generator-woyo.onrender.com'

export async function GET() {
  try {
    const res = await fetch(`${SESSION_API}/qr`, {
      signal: AbortSignal.timeout(30000)
    })

    const text = await res.text()

    let data
    try {
      data = JSON.parse(text)
    } catch {
      return NextResponse.json({ error: 'Invalid response from session server' }, { status: 500 })
    }

    const qr = data.qr || data.qrCode || data.qr_code || data.data
    if (qr) {
      return NextResponse.json({ qr })
    }

    return NextResponse.json({ error: data.message || data.error || 'QR generation failed. Try again.' }, { status: 500 })
  } catch {
    return NextResponse.json({ error: 'Session server timed out. It may be waking up — wait 30 seconds and try again.' }, { status: 500 })
  }
}
