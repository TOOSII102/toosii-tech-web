import { NextResponse } from 'next/server'

const BASE = 'https://apis.xcasper.space/api/dramabox'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || 'trending'
    const q      = searchParams.get('q') || ''
    const id     = searchParams.get('id') || ''
    const genre  = searchParams.get('genre') || '0'
    const page   = searchParams.get('page') || '1'
    const episode = searchParams.get('episode') || '0'

    let url = `${BASE}?action=${encodeURIComponent(action)}`
    if (q)       url += `&q=${encodeURIComponent(q)}`
    if (id)      url += `&id=${encodeURIComponent(id)}`
    if (genre)   url += `&genre=${encodeURIComponent(genre)}`
    if (page)    url += `&page=${encodeURIComponent(page)}`
    if (episode) url += `&episode=${encodeURIComponent(episode)}`

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) throw new Error(`Upstream ${res.status}`)
    const data = await res.json()

    if (!data.success) {
      return NextResponse.json({ error: data.message || 'Request failed.' }, { status: 502 })
    }

    return NextResponse.json(data)
  } catch (e) {
    console.error('[dramabox]', e.message)
    return NextResponse.json({ error: 'DramaBox service unavailable. Try again.' }, { status: 500 })
  }
}
