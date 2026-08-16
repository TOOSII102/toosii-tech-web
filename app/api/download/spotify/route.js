import { NextResponse } from 'next/server'

const EP = 'https://eliteprotech-apis.zone.id'

export async function POST(req) {
  try {
    const { url } = await req.json()
    if (!url || !/open\.spotify\.com/i.test(url)) {
      return NextResponse.json({ error: 'Please provide a valid Spotify track URL.' }, { status: 400 })
    }

    const res = await fetch(`${EP}/spotify?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) throw new Error(`EliteProTech ${res.status}`)
    const data = await res.json()

    if (!data.success || !data.data?.download) {
      return NextResponse.json({ error: 'Could not fetch this track. Make sure it is a public Spotify track.' }, { status: 502 })
    }

    const meta = data.data.metadata || {}
    return NextResponse.json({
      title:     meta.title    || 'Unknown Title',
      artist:    meta.artist   || meta.artists || '',
      duration:  meta.duration || null,
      thumbnail: Array.isArray(meta.images) ? meta.images[0] : (meta.image || meta.thumbnail || null),
      download:  data.data.download,
    })
  } catch (e) {
    console.error('[spotify]', e.message)
    return NextResponse.json({ error: 'Download failed. Try again later.' }, { status: 500 })
  }
}
