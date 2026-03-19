import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://giftedtech.web.id/api/session/qr', {
      signal: AbortSignal.timeout(20000)
    })
    const data = await res.json()

    if (data.status && data.qr) {
      return NextResponse.json({ qr: data.qr })
    }

    return NextResponse.json({ error: data.message || 'QR generation failed' }, { status: 500 })
  } catch {
    return NextResponse.json({ error: 'QR generator timed out. Try again.' }, { status: 500 })
  }
}
