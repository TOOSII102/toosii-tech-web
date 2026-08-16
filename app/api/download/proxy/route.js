import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const fileUrl  = searchParams.get('url')
  const filename = searchParams.get('name') || 'download'

  if (!fileUrl) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  try {
    const res = await fetch(fileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept':     '*/*',
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
    const contentLen  = res.headers.get('content-length')
    const body        = res.body

    const headers = {
      'Content-Type':        contentType,
      'Content-Disposition': `attachment; filename="${filename.replace(/"/g, '\\"')}"`,
      'Cache-Control':       'no-store',
      'Access-Control-Allow-Origin': '*',
    }
    if (contentLen) headers['Content-Length'] = contentLen

    return new Response(body, { status: 200, headers })
  } catch (e) {
    return NextResponse.json({ error: 'Proxy error: ' + e.message }, { status: 500 })
  }
}
