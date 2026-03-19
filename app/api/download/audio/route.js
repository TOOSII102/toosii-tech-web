import { NextResponse } from 'next/server'

export async function POST(request) {
  const { url } = await request.json()
  if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  const methods = [
    () => tryGiftedTechMp3(url),
    () => tryLoaderTo(url),
  ]

  for (const method of methods) {
    try {
      const result = await method()
      if (result) return NextResponse.json(result)
    } catch {}
  }

  return NextResponse.json({ error: 'Could not extract audio. Make sure it is a valid YouTube URL.' }, { status: 500 })
}

async function tryGiftedTechMp3(url) {
  const res = await fetch(`https://giftedtech.web.id/api/downloader/ytmp3?url=${encodeURIComponent(url)}`, {
    signal: AbortSignal.timeout(20000)
  })
  const data = await res.json()
  if (data.status && data.result?.download_url) {
    return {
      download_url: data.result.download_url,
      title: data.result.title || null,
      thumbnail: data.result.thumbnail || null,
      duration: data.result.duration || null,
    }
  }
  return null
}

async function tryLoaderTo(url) {
  const idRes = await fetch('https://loader.to/api/button/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `url=${encodeURIComponent(url)}&format=mp3`,
    signal: AbortSignal.timeout(10000)
  })
  const idData = await idRes.json()
  if (!idData.id) return null

  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const progRes = await fetch(`https://loader.to/api/progress.php?id=${idData.id}`, {
      signal: AbortSignal.timeout(8000)
    })
    const prog = await progRes.json()
    if (prog.success && prog.download_url) {
      return { download_url: prog.download_url }
    }
  }
  return null
}
