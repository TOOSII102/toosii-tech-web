import { NextResponse } from 'next/server'

export async function POST(request) {
  const { url } = await request.json()
  if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  const methods = [
    () => tryGiftedTech(url),
    () => tryCobalt(url),
  ]

  for (const method of methods) {
    try {
      const result = await method()
      if (result) return NextResponse.json(result)
    } catch {}
  }

  return NextResponse.json({ error: 'Could not fetch video from this URL. Try a direct YouTube or TikTok link.' }, { status: 500 })
}

async function tryGiftedTech(url) {
  const res = await fetch(`https://giftedtech.web.id/api/downloader/ytv?url=${encodeURIComponent(url)}`, {
    signal: AbortSignal.timeout(15000)
  })
  const data = await res.json()
  if (data.status && data.result?.download_url) {
    return {
      download_url: data.result.download_url,
      title: data.result.title || null,
      thumbnail: data.result.thumbnail || null,
      quality: data.result.quality || '720p',
      size: data.result.size || null,
    }
  }
  return null
}

async function tryCobalt(url) {
  const res = await fetch('https://api.cobalt.tools/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ url, downloadMode: 'auto', videoQuality: '720' }),
    signal: AbortSignal.timeout(15000)
  })
  const data = await res.json()
  if (data.url && (data.status === 'tunnel' || data.status === 'redirect')) {
    return { download_url: data.url, quality: '720p' }
  }
  if (data.status === 'picker' && data.picker?.[0]?.url) {
    return { download_url: data.picker[0].url, quality: '720p' }
  }
  return null
}
