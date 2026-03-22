import { NextResponse } from 'next/server'

export const runtime = 'edge'

const BASE = 'https://apis.xcasper.space/api/dramabox'
const CDN_HEADERS = {
  'Referer': 'https://www.dramabox.com/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
}

async function getStreamSrc(id, epIdx) {
  const res  = await fetch(`${BASE}?action=streams&id=${encodeURIComponent(id)}&episode=${epIdx}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
  const data = await res.json()
  const qualities = data.qualities || []
  const src = qualities.find(q => q.is_default)?.url || qualities[0]?.url || data.default_url || ''
  return { src, epNum: data.episode_number || epIdx + 1, title: data.drama_title || '' }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const action  = searchParams.get('action') || 'trending'
    const q       = searchParams.get('q') || ''
    const id      = searchParams.get('id') || ''
    const genre   = searchParams.get('genre') || '0'
    const page    = searchParams.get('page') || '1'
    const episode = searchParams.get('episode') || '0'

    /* ── Inline video player page ── */
    if (action === 'watch') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      const epIdx = parseInt(episode, 10) || 0
      const { src, epNum } = await getStreamSrc(id, epIdx)

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="referrer" content="no-referrer">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;background:#000;overflow:hidden}
    video{width:100%;height:100%;object-fit:contain;display:block;background:#000}
    .err{color:#f87171;font-family:sans-serif;font-size:13px;
         height:100%;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px}
  </style>
</head>
<body>
  ${src
    ? `<video src="${src}" controls autoplay playsinline preload="metadata"></video>`
    : `<div class="err">Stream unavailable for Episode ${epNum}</div>`
  }
</body>
</html>`

      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    }

    /* ── Download: proxy video with Content-Disposition so browser saves it ── */
    if (action === 'download') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      const epIdx = parseInt(episode, 10) || 0
      const { src, epNum } = await getStreamSrc(id, epIdx)

      if (!src) {
        return new Response(
          `<html><body style="font:14px sans-serif;color:#f87171;padding:20px">
            ⚠️ Episode ${epNum} stream not found.
          </body></html>`,
          { status: 404, headers: { 'Content-Type': 'text/html' } }
        )
      }

      /* Stream the video through our server with Content-Disposition: attachment.
         Because this URL is same-origin, the browser triggers a real download dialog
         without leaving the page when the link is clicked from an iframe. */
      const videoRes = await fetch(src, { headers: CDN_HEADERS })
      if (!videoRes.ok) return NextResponse.json({ error: 'CDN unavailable' }, { status: 502 })

      const resHeaders = new Headers()
      resHeaders.set('Content-Type', videoRes.headers.get('content-type') || 'video/mp4')
      resHeaders.set('Content-Disposition', `attachment; filename="Episode_${epNum}.mp4"`)
      resHeaders.set('Cache-Control', 'no-store')
      const cl = videoRes.headers.get('content-length')
      if (cl) resHeaders.set('Content-Length', cl)

      return new Response(videoRes.body, { status: 200, headers: resHeaders })
    }

    /* ── Standard API proxy ── */
    let url = `${BASE}?action=${encodeURIComponent(action)}`
    if (q)       url += `&q=${encodeURIComponent(q)}`
    if (id)      url += `&id=${encodeURIComponent(id)}`
    if (genre)   url += `&genre=${encodeURIComponent(genre)}`
    if (page)    url += `&page=${encodeURIComponent(page)}`
    if (episode) url += `&episode=${encodeURIComponent(episode)}`

    const res  = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
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
