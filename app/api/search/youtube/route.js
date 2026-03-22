export const runtime = 'edge'

function parseResults(data) {
  try {
    const sections =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents ||
      data?.contents?.sectionListRenderer?.contents ||
      []

    const items = []
    for (const section of sections) {
      const contents =
        section?.itemSectionRenderer?.contents ||
        section?.musicShelfRenderer?.contents ||
        []
      for (const item of contents) {
        const vr = item.videoRenderer || item.compactVideoRenderer
        if (!vr) continue
        const id = vr.videoId
        if (!id) continue

        const title =
          vr.title?.runs?.[0]?.text ||
          vr.title?.accessibility?.accessibilityData?.label?.split(' ')[0] ||
          ''
        const duration =
          vr.lengthText?.simpleText ||
          vr.lengthText?.runs?.map(r => r.text).join('') ||
          ''
        const channel =
          vr.longBylineText?.runs?.[0]?.text ||
          vr.ownerText?.runs?.[0]?.text ||
          vr.shortBylineText?.runs?.[0]?.text ||
          ''
        const thumbs = vr.thumbnail?.thumbnails || []
        const thumbnail =
          thumbs.find(t => t.width >= 320)?.url ||
          thumbs[thumbs.length - 1]?.url ||
          `https://img.youtube.com/vi/${id}/hqdefault.jpg`
        const views =
          vr.viewCountText?.simpleText ||
          vr.viewCountText?.runs?.[0]?.text ||
          ''

        items.push({
          id,
          title,
          url: `https://youtu.be/${id}`,
          thumbnail,
          duration,
          channel,
          views,
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

  try {
    const res = await fetch('https://www.youtube.com/youtubei/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-YouTube-Client-Name': '1',
        'X-YouTube-Client-Version': '2.20231219.04.00',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      body: JSON.stringify({
        query: q,
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20231219.04.00',
            hl: 'en',
            gl: 'US',
          },
        },
      }),
    })

    if (!res.ok) throw new Error(`YouTube ${res.status}`)

    const data = await res.json()
    const results = parseResults(data)

    if (results.length) return Response.json({ results })

    return Response.json({ results: [], error: 'No videos found for that search' })
  } catch (e) {
    return Response.json({ error: String(e.message) }, { status: 500 })
  }
}
