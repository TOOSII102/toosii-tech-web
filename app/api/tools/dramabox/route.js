import { NextResponse } from 'next/server'

const BASE = 'https://apis.xcasper.space/api/dramabox'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const action  = searchParams.get('action') || 'trending'
    const q       = searchParams.get('q') || ''
    const id      = searchParams.get('id') || ''
    const genre   = searchParams.get('genre') || '0'
    const page    = searchParams.get('page') || '1'
    const episode = searchParams.get('episode') || '0'

    if (action === 'watch') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      const epIdx = parseInt(episode, 10) || 0

      const epRes  = await fetch(`${BASE}?action=episodes&id=${encodeURIComponent(id)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(15000),
      })
      const epData = await epRes.json()
      const ep     = epData.episodes?.[epIdx]
      const title  = epData.title || 'Episode ' + (epIdx + 1)

      const src = ep?.stream_url || ''
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="referrer" content="no-referrer">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} · Ep ${epIdx + 1}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#000;color:#fff;font-family:sans-serif;height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center}
    h1{font-size:14px;opacity:.6;margin-bottom:10px;text-align:center;padding:0 12px}
    video{width:100%;max-height:90dvh;background:#000}
    .err{color:#f87171;text-align:center;padding:20px}
  </style>
</head>
<body>
  ${src
    ? `<h1>${title} — Episode ${epIdx + 1}</h1><video src="${src}" controls autoplay playsinline></video>`
    : `<p class="err">⚠️ This episode is locked or unavailable.</p>`
  }
</body>
</html>`

      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    }

    let url = `${BASE}?action=${encodeURIComponent(action)}`
    if (q)       url += `&q=${encodeURIComponent(q)}`
    if (id)      url += `&id=${encodeURIComponent(id)}`
    if (genre)   url += `&genre=${encodeURIComponent(genre)}`
    if (page)    url += `&page=${encodeURIComponent(page)}`
    if (episode) url += `&episode=${encodeURIComponent(episode)}`

    const res  = await fetch(url, {
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
