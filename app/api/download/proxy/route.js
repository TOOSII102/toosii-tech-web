import { NextResponse } from 'next/server'
import { tagMp3Buffer } from '../../../../lib/id3'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const fileUrl  = searchParams.get('url')
  const filename = searchParams.get('name') || 'download'
  const title = searchParams.get('title') || filename.replace(/\.mp3$/i, '')
  const artist = searchParams.get('artist') || 'Toosii'
  const album = searchParams.get('album') || 'Toosii Downloads'
  const thumbnail = searchParams.get('thumbnail') || null

  if (!fileUrl) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  try {
    const isXcasper = fileUrl.includes('xcasper.space')
    const xcasperHdrs = isXcasper ? { 'Referer': 'https://xcasper.space/', 'Origin': 'https://xcasper.space' } : {}
    const res = await fetch(fileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept':     '*/*',
        ...xcasperHdrs,
      },
      signal: AbortSignal.timeout(120000),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: 502 }
      )
    }

    const contentType = res.headers.get('content-type') || 'application/octet-stream'
    const isMp3 = contentType.toLowerCase().includes('audio/mpeg') || /\.mp3(?:$|[?#])/i.test(filename) || /\.mp3(?:$|[?#])/i.test(fileUrl)
    const safeFilename = filename.replace(/[\r\n"]/g, '').trim() || 'download'
    const asciiFilename = safeFilename.normalize('NFKD').replace(/[^\x20-\x7E]/g, '_')
    const headers = {
      'Content-Type':        contentType,
      'Content-Disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
      'Cache-Control':       'no-store',
      'Access-Control-Allow-Origin': '*',
    }

    if (isMp3) {
      const sourceBuffer = Buffer.from(await res.arrayBuffer())
      const taggedBuffer = await tagMp3Buffer(sourceBuffer, { title, artist, album, thumbnail })
      headers['Content-Type'] = 'audio/mpeg'
      headers['Content-Length'] = String(taggedBuffer.length)
      headers['X-ID3-Tagged'] = '1'
      return new Response(taggedBuffer, { status: 200, headers })
    }

    const contentLen = res.headers.get('content-length')
    if (contentLen) headers['Content-Length'] = contentLen
    return new Response(res.body, { status: 200, headers })
  } catch (e) {
    return NextResponse.json({ error: 'Proxy error: ' + e.message }, { status: 500 })
  }
}
