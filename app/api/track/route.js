import { NextResponse } from 'next/server'
import { recordHit } from '../../../lib/visitorStore'

export async function POST(req) {
  try {
    const { page, referrer } = await req.json()
    const country = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || ''
    const city    = req.headers.get('x-vercel-ip-city') || ''
    const ua      = req.headers.get('user-agent') || ''
    const device  = /mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua) ? 'mobile' : 'desktop'
    const isBot   = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp/i.test(ua)
    if (!isBot && page && !page.startsWith('/admin') && !page.startsWith('/api')) {
      recordHit({ page, country, city, device, referrer: referrer || '' })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
