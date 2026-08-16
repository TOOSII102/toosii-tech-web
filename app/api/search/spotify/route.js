import { NextResponse } from 'next/server'

export async function GET(req) {
  const q = new URL(req.url).searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ error: 'Query required' }, { status: 400 })

  try {
    const res = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=16`,
      { next: { revalidate: 30 } }
    )
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
    return NextResponse.json({ results: tracks })
  } catch (e) {
    return NextResponse.json({ error: 'Search failed', message: e.message }, { status: 500 })
  }
}
