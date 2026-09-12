import { NextResponse } from 'next/server'
import { partnerSpotifySearch } from '../../../../lib/partnerApi'

export async function GET(req) {
  const q = new URL(req.url).searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ error: 'Query required' }, { status: 400 })

  try {
    const res = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=16`,
      { next: { revalidate: 30 } }
    )
    if (!res.ok) throw new Error(`Deezer ${res.status}`)
    const data = await res.json()
    const tracks = (data.data || []).map(t => ({
      id:       t.id,
      title:    t.title,
      artist:   t.artist?.name || '',
      album:    t.album?.title || '',
      cover:    t.album?.cover_medium || t.album?.cover || '',
      duration: t.duration || 0,
      preview:  t.preview || '',
      link:     t.link || '',
      explicit: t.explicit_lyrics || false,
    }))
    if (tracks.length) return NextResponse.json({ results: tracks, source: 'deezer' })
  } catch (e) {
    console.error('[spotify:deezer]', e.message)
  }

  // Fallback: Partner API Spotify search.
  try {
    const partner = await partnerSpotifySearch(q)
    if (partner?.length) return NextResponse.json({ results: partner, source: 'fallback' })
  } catch (e) {
    console.error('[spotify:fallback]', e.message)
  }

  return NextResponse.json({ error: 'Search failed', message: 'Both music sources are unavailable. Try again shortly.' }, { status: 500 })
}
