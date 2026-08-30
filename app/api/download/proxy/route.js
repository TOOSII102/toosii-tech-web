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

    // The download manager (lib/downloadManager.js) always sends a Range header so it
    // can pause/resume without losing bytes. Forward it upstream so large video files
    // stream straight through without ever being buffered in memory here.
    const rangeHeader = request.headers.get('range')
    const requestedStart = (() => {
      const match = rangeHeader && /bytes=(\d+)-/.exec(rangeHeader)
      return match ? parseInt(match[1], 10) : 0
    })()

    const res = await fetch(fileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept':     '*/*',
        ...(rangeHeader ? { Range: rangeHeader } : {}),
        ...xcasperHdrs,
      },
      signal: AbortSignal.timeout(120000),
    })

    if (!res.ok && res.status !== 206) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: 502 }
      )
    }

    const contentType = res.headers.get('content-type') || 'application/octet-stream'
    const isMp3 = contentType.toLowerCase().includes('audio/mpeg') || /\.mp3(?:$|[?#])/i.test(filename) || /\.mp3(?:$|[?#])/i.test(fileUrl)
    const safeFilename = filename.replace(/[\r\n"]/g, '').trim() || 'download'
    const asciiFilename = safeFilename.normalize('NFKD').replace(/[^\x20-\x7E]/g, '_')
    const baseHeaders = {
      'Content-Disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
      'Cache-Control':       'no-store',
      'Access-Control-Allow-Origin': '*',
      'Accept-Ranges':       'bytes',
    }

    // MP3s need to be fully buffered anyway so id3 tags can be written — small files,
    // so slicing the tagged buffer to answer Range requests is cheap and safe.
    if (isMp3) {
      const sourceBuffer = Buffer.from(await res.arrayBuffer())
      const bodyBuffer = await tagMp3Buffer(sourceBuffer, { title, artist, album, thumbnail })
      const totalSize = bodyBuffer.length
      const tagHeaders = { ...baseHeaders, 'Content-Type': 'audio/mpeg', 'X-ID3-Tagged': '1' }

      if (rangeHeader) {
        const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader)
        let start = match?.[1] ? parseInt(match[1], 10) : 0
        let end = match?.[2] ? parseInt(match[2], 10) : totalSize - 1
        if (Number.isNaN(start) || start < 0) start = 0
        if (Number.isNaN(end) || end >= totalSize) end = totalSize - 1
        if (start > end || start >= totalSize) {
          return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${totalSize}`, 'Accept-Ranges': 'bytes' } })
        }
        const chunk = bodyBuffer.subarray(start, end + 1)
        return new Response(chunk, {
          status: 206,
          headers: { ...tagHeaders, 'Content-Length': String(chunk.length), 'Content-Range': `bytes ${start}-${end}/${totalSize}` },
        })
      }
      return new Response(bodyBuffer, { status: 200, headers: { ...tagHeaders, 'Content-Length': String(totalSize) } })
    }

    // Non-mp3 (video etc): stream straight through whenever possible, no buffering.
    const passHeaders = { ...baseHeaders, 'Content-Type': contentType }
    const contentLength = res.headers.get('content-length')
    if (contentLength) passHeaders['Content-Length'] = contentLength

    if (res.status === 206) {
      // Upstream honored our Range request — pass its partial response straight through.
      const upstreamRange = res.headers.get('content-range')
      if (upstreamRange) passHeaders['Content-Range'] = upstreamRange
      return new Response(res.body, { status: 206, headers: passHeaders })
    }

    if (requestedStart === 0) {
      // Fresh download (no resume in progress) — stream the full body through as-is.
      return new Response(res.body, { status: 200, headers: passHeaders })
    }

    // A genuine resume (requestedStart > 0) hit an upstream that ignores Range and sent
    // the whole file back from byte 0. Buffering here — only in this uncommon case — is
    // what keeps the client from silently duplicating already-downloaded bytes.
    const fullBuffer = Buffer.from(await res.arrayBuffer())
    const totalSize = fullBuffer.length
    if (requestedStart >= totalSize) {
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${totalSize}`, 'Accept-Ranges': 'bytes' } })
    }
    const chunk = fullBuffer.subarray(requestedStart)
    return new Response(chunk, {
      status: 206,
      headers: { ...passHeaders, 'Content-Length': String(chunk.length), 'Content-Range': `bytes ${requestedStart}-${totalSize - 1}/${totalSize}` },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Proxy error: ' + e.message }, { status: 500 })
  }
}
