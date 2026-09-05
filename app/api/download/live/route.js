import { NextResponse } from 'next/server'
import { resolveInstagramDownloadUrl } from '../../../../lib/resolveInstagram'
import { streamFileResponse } from '../../../../lib/streamFile'

export const runtime = 'nodejs'
export const maxDuration = 120

// Unlike /api/download/proxy (which streams a URL you already resolved and might be
// holding onto), this route takes the ORIGINAL post URL and resolves + streams it in
// one request. That matters for sources like Instagram whose CDN links are signed
// with short-lived tokens — resolving ahead of time and reusing the link later (e.g.
// after the person reads the preview, then clicks Download) risks the link expiring
// before it's ever fetched, which is what caused intermittent Instagram failures.
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform')
  const sourceUrl = searchParams.get('url')
  const filename = searchParams.get('name') || 'download.mp4'

  if (!sourceUrl) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  try {
    let resolved
    if (platform === 'instagram') {
      resolved = await resolveInstagramDownloadUrl(sourceUrl)
    } else {
      return NextResponse.json({ error: `Unsupported platform: ${platform}` }, { status: 400 })
    }

    if (!resolved?.download_url) {
      return NextResponse.json({ error: 'Could not resolve a download link for this post — it may be private, deleted, or temporarily unavailable.' }, { status: 502 })
    }

    return await streamFileResponse(request, resolved.download_url, filename, { title: resolved.title })
  } catch (e) {
    return NextResponse.json({ error: 'Resolve error: ' + e.message }, { status: 500 })
  }
}
