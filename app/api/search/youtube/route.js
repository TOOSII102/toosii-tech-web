export const runtime = 'edge'

function parseInnerTube(data) {
  try {
    const sections =
      data?.contents?.sectionListRenderer?.contents ||
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents ||
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
          vr.title?.accessibility?.accessibilityData?.label ||
          ''
        const duration = vr.lengthText?.simpleText || vr.lengthText?.runs?.[0]?.text || ''
        const channel =
          vr.ownerText?.runs?.[0]?.text ||
          vr.longBylineText?.runs?.[0]?.text ||
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
        items.push({ id, title, url: `https://youtu.be/${id}`, thumbnail, duration, channel, views })
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

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'com.google.android.youtube/17.31.35 (Linux; U; Android 11) gzip',
    'X-YouTube-Client-Name': '3',
    'X-YouTube-Client-Version': '17.31.35',
  }

  const body = JSON.stringify({
    query: q,
    context: {
      client: {
        clientName: 'ANDROID',
        clientVersion: '17.31.35',
        androidSdkVersion: 30,
        hl: 'en',
        gl: 'US',
      },
    },
    params: 'EgIQAQ%3D%3D',
  })

  try {
    const res = await fetch(
      'https://www.youtube.com/youtubei/v1/search?key=AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM394',
      { method: 'POST', headers, body }
    )
    if (!res.ok) throw new Error(`InnerTube ${res.status}`)
    const data = await res.json()
    const results = parseInnerTube(data)
    if (results.length) return Response.json({ results })
    return Response.json({ results: [], debug: 'no results parsed' })
  } catch (e) {
    return Response.json({ error: String(e.message) }, { status: 500 })
  }
}
