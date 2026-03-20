import { NextResponse } from 'next/server'

const EP = 'https://eliteprotech-apis.zone.id'

export async function POST(req) {
  try {
    const { url } = await req.json()
    if (!url || !/open\.spotify\.com\/track\//i.test(url)) {
      return NextResponse.json({ error: 'Please provide a valid Spotify track URL.' }, { status: 400 })
    }

    const ep = await fetch(`${EP}/spotify?url=${encodeURIComponent(url.trim())}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(25000),
    }).then(r => r.json())

    if (!ep.success || !ep.data?.download) {
      return NextResponse.json({ error: 'Could not fetch track. Make sure the link is a public Spotify track.' }, { status: 502 })
    }

    return NextResponse.json({
      title:    ep.data.metadata?.title    || 'Unknown Title',
      artist:   ep.data.metadata?.artist   || 'Unknown Artist',
      duration: ep.data.metadata?.duration || '--:--',
      cover:    ep.data.metadata?.images   || null,
      download: ep.data.download,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Service unavailable. Please try again.' }, { status: 500 })
  }
}
