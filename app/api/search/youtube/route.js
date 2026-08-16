export const runtime = 'edge'

function fmtViews(n) {
  if (!n) return ''
  const num = Number(n)
  if (isNaN(num)) return ''
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B views'
  if (num >= 1_000_000)     return (num / 1_000_000).toFixed(1).replace(/\.0$/, '')     + 'M views'
  if (num >= 1_000)         return (num / 1_000).toFixed(1).replace(/\.0$/, '')         + 'K views'
  return num + ' views'
}

function parseInnerTube(data) {
  try {
    const sections =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents ||
      data?.contents?.sectionListRenderer?.contents ||
      []
    const items = []
    for (const section of sections) {
      for (const item of (section?.itemSectionRenderer?.contents || [])) {
        const vr = item.videoRenderer
        if (!vr?.videoId) continue
        const id = vr.videoId
        const thumbs = vr.thumbnail?.thumbnails || []
        items.push({
          id,
          title:     vr.title?.runs?.[0]?.text || '',
          url:       `https://youtu.be/${id}`,
          thumbnail: thumbs.find(t => t.width >= 320)?.url || thumbs.at(-1)?.url || `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
          duration:  vr.lengthText?.simpleText || vr.lengthText?.runs?.map(r => r.text).join('') || '',
          channel:   vr.longBylineText?.runs?.[0]?.text || vr.ownerText?.runs?.[0]?.text || '',
          views:     vr.viewCountText?.simpleText || '',
        })
      }
    }
    return items
  } catch {
    return []
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  if (!q) return Response.json({ error: 'Missing query' }, { status: 400 })

  /* ── Primary: EliteProTech ── */
  try {
    const res = await fetch(
      `https://eliteprotech-apis.zone.id/ytsearch?q=${encodeURIComponent(q)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    if (res.ok) {
      const data = await res.json()
      if (data.success && data.results?.videos?.length) {
        const results = data.results.videos.map(v => ({
          id:        v.id,
          title:     v.title || '',
          url:       v.url || `https://youtu.be/${v.id}`,
          thumbnail: v.thumbnail || `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
          duration:  v.duration || '',
          channel:   v.author?.name || '',
          views:     fmtViews(v.views),
          uploaded:  v.uploaded || '',
        }))
        return Response.json({ results, source: 'eliteprotech' })
      }
    }
  } catch { /* fall through */ }

  /* ── Fallback: YouTube InnerTube WEB ── */
  try {
    const res = await fetch('https://www.youtube.com/youtubei/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'X-YouTube-Client-Name': '1',
        'X-YouTube-Client-Version': '2.20231219.04.00',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      body: JSON.stringify({
        query: q,
        context: {
          client: { clientName: 'WEB', clientVersion: '2.20231219.04.00', hl: 'en', gl: 'US' },
        },
      }),
    })
    if (!res.ok) throw new Error(`YouTube ${res.status}`)
    const data = await res.json()
    const results = parseInnerTube(data)
    if (results.length) return Response.json({ results, source: 'innertube' })
  } catch { /* fall through */ }

  return Response.json({ results: [], error: 'Search unavailable — try again shortly' })
}
