import { NextResponse } from 'next/server'

const BASE = Buffer.from('aHR0cHM6Ly9hcGlzLnhjYXNwZXIuc3BhY2UvYXBpL2RyYW1hYm94', 'base64').toString()
const CDN_HEADERS = {
  'Referer': 'https://www.dramabox.com/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
}

async function getStreamSrc(id, epIdx) {
  /* Use the episodes action — each episode object already contains stream_url.
     The old `streams` action is broken and always returns an error. */
  const res = await fetch(
    `${BASE}?action=episodes&id=${encodeURIComponent(id)}`,
    { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(12000) }
  )
  const data = await res.json()

  if (!data?.success || !Array.isArray(data.episodes)) {
    return { src: '', epNum: epIdx + 1, title: data?.title || '' }
  }

  /* Find by index — episodes list uses zero-based `index` field */
  const ep = data.episodes.find(e => e.index === epIdx) ?? data.episodes[epIdx] ?? null
  const src = ep?.stream_url || ''
  const epNum = ep?.number ? parseInt(ep.number, 10) : epIdx + 1

  return { src, epNum, title: data.title || '' }
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
    html,body{width:100%;height:100%;overflow:hidden;background:#000}
    .wrap{position:relative;width:100%;height:100%}
    /* Blurred ambient fill — same src, muted, covers the black bars */
    video.bg{
      position:absolute;inset:-8%;width:116%;height:116%;
      object-fit:cover;
      filter:blur(18px) brightness(0.35) saturate(1.4);
      pointer-events:none;
    }
    /* Actual player — centred, contained, with controls */
    video.fg{
      position:absolute;inset:0;width:100%;height:100%;
      object-fit:contain;
    }
    .err{
      position:absolute;inset:0;font-family:sans-serif;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      text-align:center;padding:24px;gap:14px;background:#0a0a0a;
    }
    .err-icon{font-size:2rem}
    .err-msg{color:#f87171;font-size:13px;line-height:1.5}
    .retry-btn{
      margin-top:4px;padding:10px 24px;
      background:#25d366;color:#000;
      border:none;border-radius:8px;
      font-size:13px;font-weight:700;cursor:pointer;
    }
    .retry-btn:hover{opacity:.85}
  </style>
</head>
<body>
  ${src ? `
  <div class="wrap">
    <video class="bg" src="${src}" autoplay muted loop playsinline preload="metadata"></video>
    <video class="fg" src="${src}" controls autoplay playsinline preload="metadata"></video>
  </div>` : `
  <div class="err">
    <span class="err-icon">🔒</span>
    <span class="err-msg">Episode ${epNum} is a premium episode on DramaBox and is not available for free streaming.<br>Try an earlier episode or search for a different drama.</span>
  </div>`}
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
