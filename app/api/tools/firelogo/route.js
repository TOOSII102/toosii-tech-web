import { NextResponse } from 'next/server'

const EP = 'https://eliteprotech-apis.zone.id'

function escapeXml(value) {
  return value.replace(/[&<>\"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&apos;' })[char])
}

function fallbackLogo(text) {
  const safeText = escapeXml(text)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#090b0f"/><stop offset=".55" stop-color="#27100b"/><stop offset="1" stop-color="#090b0f"/></linearGradient><linearGradient id="fire" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff5a1f"/><stop offset=".52" stop-color="#ffc247"/><stop offset="1" stop-color="#fff2a6"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="9" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="800" height="400" rx="28" fill="url(#bg)"/><path d="M110 270c-18-55 35-71 25-133 56 43 30 81 65 100 22-47 63-55 52-126 73 64 55 129 15 159H180c-31 0-55-25-70-0z" fill="url(#fire)" opacity=".92" filter="url(#glow)"/><text x="400" y="215" fill="#fff" font-family="Arial,Helvetica,sans-serif" font-size="76" font-weight="800" text-anchor="middle" letter-spacing="2" filter="url(#glow)">${safeText}</text><text x="400" y="274" fill="#72f0ba" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="700" text-anchor="middle" letter-spacing="7">TOOSII TECH</text></svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

export async function POST(req) {
  try {
    const { text } = await req.json()
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Please provide text to generate a logo.' }, { status: 400 })
    }
    if (text.trim().length > 20) {
      return NextResponse.json({ error: 'Text must be 20 characters or less.' }, { status: 400 })
    }

    try {
      const response = await fetch(`${EP}/firelogo?text=${encodeURIComponent(text.trim())}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(12000),
      })
      if (response.ok) {
        const ep = await response.json()
        if (ep.success && ep.image) return NextResponse.json({ image: ep.image, text: ep.text || text.trim(), source: 'Toosii Tech' })
      }
    } catch (providerError) {
      console.error('[firelogo:upstream]', providerError.message)
    }

    return NextResponse.json({ image: fallbackLogo(text.trim()), text: text.trim(), source: 'Toosii Tech fallback' })
  } catch (e) {
    console.error('[firelogo]', e.message)
    return NextResponse.json({ error: 'Service unavailable. Please try again.' }, { status: 500 })
  }
}
