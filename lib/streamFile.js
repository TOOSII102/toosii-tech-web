import { NextResponse } from 'next/server'
import { tagMp3Buffer } from './id3'

/**
 * Streams `fileUrl` back to the client with proper Content-Disposition/Range/error
 * handling. Shared by /api/download/proxy (static "here's a link, stream it") and
 * /api/download/live (resolve-then-stream in one request, used where the upstream
 * link is short-lived and must be fetched immediately after resolving it).
 */
export async function streamFileResponse(request, fileUrl, filename, meta = {}) {
  const { title, artist = 'Toosii', album = 'Toosii Downloads', thumbnail = null } = meta

  const isXcasper = fileUrl.includes('xcasper.space')
  const xcasperHdrs = isXcasper ? { 'Referer': 'https://xcasper.space/', 'Origin': 'https://xcasper.space' } : {}
  // Instagram's CDN checks for a plausible Referer/Origin before serving these signed
  // URLs — without it, it returns a JSON/HTML error instead of the video.
  const isInstagramCdn = /(^|\.)cdninstagram\.com$|(^|\.)fbcdn\.net$/i.test(new URL(fileUrl).hostname)
  const instagramHdrs = isInstagramCdn ? { 'Referer': 'https://www.instagram.com/', 'Origin': 'https://www.instagram.com' } : {}

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
      ...instagramHdrs,
    },
    signal: AbortSignal.timeout(120000),
  })

  if (!res.ok && res.status !== 206) {
    return NextResponse.json({ error: `Upstream returned ${res.status}` }, { status: 502 })
  }

  const contentType = res.headers.get('content-type') || 'application/octet-stream'
  const isMp3 = contentType.toLowerCase().includes('audio/mpeg') || /\.mp3(?:$|[?#])/i.test(filename) || /\.mp3(?:$|[?#])/i.test(fileUrl)

  // If we expected a video but the upstream actually sent JSON/HTML (a CDN error page,
  // an expired-link response, etc.), don't pass it through — fail cleanly instead of
  // saving a mislabeled/corrupted file the browser will flag as failed anyway.
  const looksLikeErrorPayload = /^(application\/json|text\/html|text\/plain)/i.test(contentType)
  if (!isMp3 && looksLikeErrorPayload) {
    return NextResponse.json(
      { error: 'The video link is no longer valid (it may have expired or been blocked by the source). Please try downloading again.' },
      { status: 502 }
    )
  }

  const safeFilename = filename.replace(/[\r\n"]/g, '').trim() || 'download'
  const asciiFilename = safeFilename.normalize('NFKD').replace(/[^\x20-\x7E]/g, '_')
  const baseHeaders = {
    'Content-Disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
    'Cache-Control':       'no-store',
    'Access-Control-Allow-Origin': '*',
    'Accept-Ranges':       'bytes',
  }

  if (isMp3) {
    const sourceBuffer = Buffer.from(await res.arrayBuffer())
    const bodyBuffer = await tagMp3Buffer(sourceBuffer, { title: title || safeFilename, artist, album, thumbnail })
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

  const passHeaders = { ...baseHeaders, 'Content-Type': contentType }
  const contentLength = res.headers.get('content-length')
  if (contentLength) passHeaders['Content-Length'] = contentLength

  if (res.status === 206) {
    const upstreamRange = res.headers.get('content-range')
    if (upstreamRange) passHeaders['Content-Range'] = upstreamRange
    return new Response(res.body, { status: 206, headers: passHeaders })
  }

  if (requestedStart === 0) {
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
}
