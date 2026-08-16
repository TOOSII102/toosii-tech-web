import { NextResponse } from 'next/server'
import { referenceDownload } from '../../../../lib/referenceDownloadApi'

const EP = 'https://eliteprotech-apis.zone.id'

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

    return NextResponse.json({ error: 'Download failed. Try again later.' }, { status: 500 })
  } catch (error) {
    console.error('[spotify]', error.message)
    return NextResponse.json({ error: 'Download failed. Try again later.' }, { status: 500 })
  }
}
