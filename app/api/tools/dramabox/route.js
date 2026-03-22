import { NextResponse } from 'next/server'

const BASE = 'https://apis.xcasper.space/api/dramabox'

async function getStreamSrc(id, epIdx) {
  const res  = await fetch(`${BASE}?action=streams&id=${encodeURIComponent(id)}&episode=${epIdx}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(15000),
  })
  const data = await res.json()
  const qualities = data.qualities || []
  const src = qualities.find(q => q.is_default)?.url || qualities[0]?.url || data.default_url || ''
  return { src, epNum: data.episode_number || epIdx + 1 }
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
    .err{color:#f87171;font-family:sans-serif;font-size:13px;text-align:center;
         padding:24px;height:100%;display:flex;align-items:center;justify-content:center}
  </style>
</head>
<body>
  ${src
    ? `<video src="${src}" controls autoplay playsinline preload="metadata"></video>`
    : `<div class="err">⚠️ Stream unavailable for Episode ${epNum}</div>`
  }
</body>
</html>`

      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    }

    /* ── Download trigger page ── */
    if (action === 'download') {
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
    body{background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
         min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:24px}
    h2{font-size:18px;font-weight:700;color:#25d366}
    p{font-size:13px;color:#94a3b8;text-align:center;max-width:360px;line-height:1.6}
    .btn{display:inline-flex;align-items:center;gap:8px;background:#25d366;color:#000;
         font-weight:700;font-size:14px;padding:12px 28px;border-radius:12px;text-decoration:none;
         border:none;cursor:pointer;transition:opacity .2s}
    .btn:hover{opacity:.85}
    .alt{font-size:12px;color:#475569;margin-top:8px}
  </style>
</head>
<body>
  ${src ? `
  <h2>⬇ Episode ${epNum}</h2>
  <p>Your download will start automatically. If it doesn't, tap the button below.</p>
  <a class="btn" href="${src}" download="Episode_${epNum}.mp4">⬇ Download Episode ${epNum}</a>
  <p class="alt">Tip: If download doesn't start, right-click the button → Save link as</p>
  <script>
    try {
      const a = document.createElement('a');
      a.href = '${src}';
      a.download = 'Episode_${epNum}.mp4';
      document.body.appendChild(a);
      a.click();
    } catch(e){}
  </script>
  ` : `<p style="color:#f87171">⚠️ Download unavailable for this episode.</p>`}
</body>
</html>`

      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    }

    /* ── Standard API proxy ── */
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
