import { NextResponse } from 'next/server'
import { partnerLyrics } from '../../../../lib/partnerApi'
import { hubLyrics } from '../../../../lib/apiHub'

export const dynamic = 'force-dynamic'

const KAALIX = 'https://r-bots-free-apis.co08.art'

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams.get('q')?.trim()
    if (!q) return NextResponse.json({ error: 'Pass a song title or artist in ?q=' }, { status: 400 })
    if (q.length > 120) return NextResponse.json({ error: 'Query is too long.' }, { status: 400 })

    let kaalix
    try {
      const upstream = await fetch(`${KAALIX}/api/lyrics?q=${encodeURIComponent(q)}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(25_000),
      })
      kaalix = { ok: upstream.ok, payload: await upstream.json().catch(() => null) }
    } catch (e) {
      console.error('[lyrics:primary]', e.message)
    }

    const r = kaalix?.payload?.results
    if (kaalix?.ok && kaalix?.payload?.status !== false && r && typeof r.lyrics === 'string' && r.lyrics.trim()) {
      return NextResponse.json({
        track: String(r.track || q).slice(0, 200),
        artist: String(r.artist || '').slice(0, 120) || null,
        album: String(r.album || '').slice(0, 120) || null,
        duration: String(r.duration || '').slice(0, 20) || null,
        lyrics: r.lyrics.slice(0, 12000),
        source: 'Toosii Tech',
      })
    }

    // Fallback: Partner API (lyrics → lyrics2 → lyrics3 are tried in order).
    const partner = await partnerLyrics(q)
    if (partner) {
      return NextResponse.json({ ...partner, source: 'Toosii Tech' })
    }

    // Fallback: API hub lyrics.
    const hub = await hubLyrics(q)
    if (hub) {
      return NextResponse.json({ ...hub, source: 'Toosii Tech' })
    }

    return NextResponse.json({ error: `No lyrics found for "${q}". Check the spelling or add the artist name.` }, { status: 404 })
  } catch (e) {
    console.error('[lyrics]', e.message)
    return NextResponse.json({ error: 'Lyrics service is unavailable. Please try again.' }, { status: 502 })
  }
}
