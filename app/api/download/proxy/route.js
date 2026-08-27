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

    // Buffer the full body (mp3 already had to be buffered for ID3 tagging) so we can
    // honestly answer Range requests below — this is what makes pause/resume on the
    // client (lib/downloadManager.js) safe instead of silently duplicating bytes.
    let bodyBuffer
    let finalContentType = contentType
    if (isMp3) {
      const sourceBuffer = Buffer.from(await res.arrayBuffer())
      bodyBuffer = await tagMp3Buffer(sourceBuffer, { title, artist, album, thumbnail })
      finalContentType = 'audio/mpeg'
    } else {
      bodyBuffer = Buffer.from(await res.arrayBuffer())
    }

    const totalSize = bodyBuffer.length
    const baseHeaders = {
      'Content-Type':        finalContentType,
      'Content-Disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
      'Cache-Control':       'no-store',
      'Access-Control-Allow-Origin': '*',
      'Accept-Ranges':       'bytes',
      ...(isMp3 ? { 'X-ID3-Tagged': '1' } : {}),
    }

    const rangeHeader = request.headers.get('range')
    if (rangeHeader) {
      const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader)
      if (match) {
        let start = match[1] ? parseInt(match[1], 10) : 0
        let end = match[2] ? parseInt(match[2], 10) : totalSize - 1
        if (Number.isNaN(start) || start < 0) start = 0
        if (Number.isNaN(end) || end >= totalSize) end = totalSize - 1
        if (start > end || start >= totalSize) {
          return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${totalSize}`, 'Accept-Ranges': 'bytes' } })
        }
        const chunk = bodyBuffer.subarray(start, end + 1)
        return new Response(chunk, {
          status: 206,
          headers: {
            ...baseHeaders,
            'Content-Length': String(chunk.length),
            'Content-Range': `bytes ${start}-${end}/${totalSize}`,
          },
        })
      }
    }

    return new Response(bodyBuffer, {
      status: 200,
      headers: { ...baseHeaders, 'Content-Length': String(totalSize) },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Proxy error: ' + e.message }, { status: 500 })
  }
}
