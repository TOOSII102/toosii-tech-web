import { NextResponse } from 'next/server'
import { referenceDownload } from '../../../../lib/referenceDownloadApi'

const EP = 'https://eliteprotech-apis.zone.id'

async function downloadViaYouTube(req, spotifyUrl) {
  const oembedResponse = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`, {
    signal: AbortSignal.timeout(12000),
  })
  if (!oembedResponse.ok) throw new Error(`Spotify metadata ${oembedResponse.status}`)
  const oembed = await oembedResponse.json()
  const searchTitle = String(oembed.title || '').trim()
  if (!searchTitle) throw new Error('Spotify title unavailable')

  const searchResponse = await fetch(new URL(`/api/search/youtube?q=${encodeURIComponent(searchTitle)}`, req.url), {
    signal: AbortSignal.timeout(20000),
  })
  const searchData = await searchResponse.json()
  const youtubeUrl = searchData.results?.[0]?.url
  if (!youtubeUrl) throw new Error('No matching YouTube result')

  const audioResponse = await fetch(new URL('/api/download/audio', req.url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: youtubeUrl }),
    signal: AbortSignal.timeout(90000),
  })
  const audioData = await audioResponse.json()
  if (!audioResponse.ok || !audioData.download_url) throw new Error(audioData.error || 'Audio conversion unavailable')

  return {
    ...audioData,
    title: audioData.title || searchTitle,
    thumbnail: audioData.thumbnail || oembed.thumbnail_url || null,
    platform: 'spotify',
    source: 'Toosii Tech Spotify fallback',
  }
}

export async function POST(req) {
  try {
    const { url } = await req.json()
    if (!url || !/open\.spotify\.com/i.test(url)) {
      return NextResponse.json({ error: 'Please provide a valid Spotify track URL.' }, { status: 400 })
    }

    try {
      const res = await fetch(`${EP}/spotify?url=${encodeURIComponent(url)}`, {
        signal: AbortSignal.timeout(30000),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data?.download) {
          const meta = data.data.metadata || {}
          return NextResponse.json({
            title: meta.title || 'Unknown Title',
            artist: meta.artist || meta.artists || '',
            duration: meta.duration || null,
            thumbnail: Array.isArray(meta.images) ? meta.images[0] : (meta.image || meta.thumbnail || null),
            download: data.data.download,
            download_url: data.data.download,
          })
        }
      }
    } catch (providerError) {
      console.error('[spotify:eliteprotech]', providerError.message)
    }

    try {
      const reference = await referenceDownload(url, 'spotify')
      if (reference?.download_url) {
        return NextResponse.json({
          title: 'Spotify track',
          artist: '',
          duration: null,
          thumbnail: null,
          download: reference.download_url,
          download_url: reference.download_url,
          quality: 'MP3',
        })
      }
    } catch (referenceError) {
      console.error('[spotify:reference]', referenceError.message)
    }

    try {
      const fallback = await downloadViaYouTube(req, url)
      return NextResponse.json(fallback)
    } catch (fallbackError) {
      console.error('[spotify:youtube-fallback]', fallbackError.message)
    }

    return NextResponse.json({ error: 'Download failed. Try again later.' }, { status: 502 })
  } catch (error) {
    console.error('[spotify]', error.message)
    return NextResponse.json({ error: 'Download failed. Try again later.' }, { status: 500 })
  }
}
