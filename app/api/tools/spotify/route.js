import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { url } = await req.json()
    if (!url || !/open\.spotify\.com\/track\//i.test(url)) {
      return NextResponse.json({ error: 'Please provide a valid Spotify track URL.' }, { status: 400 })
    }

    const response = await fetch(new URL('/api/download/spotify', req.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim() }),
      signal: AbortSignal.timeout(120000),
    })
    const data = await response.json()

    if (!response.ok || !data.download_url) {
      return NextResponse.json({ error: data.error || 'Could not fetch track. Make sure the link is a public Spotify track.' }, { status: response.status >= 400 ? response.status : 502 })
    }

    return NextResponse.json({
      title: data.title || 'Unknown Title',
      artist: data.artist || data.author || 'Unknown Artist',
      duration: data.duration || '--:--',
      cover: data.thumbnail || null,
      download: data.download_url,
    })
  } catch (error) {
    console.error('[tools:spotify]', error.message)
    return NextResponse.json({ error: 'Spotify service unavailable. Please try again.' }, { status: 502 })
  }
}
