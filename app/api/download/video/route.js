import { NextResponse } from 'next/server'

const GT  = 'https://api.giftedtech.co.ke/api/download'
const KEY = 'gifted'
const TO  = 25000

function detect(url) {
  if (/youtube\.com|youtu\.be/i.test(url))      return 'youtube'
  if (/tiktok\.com|vm\.tiktok\.com/i.test(url)) return 'tiktok'
  if (/instagram\.com/i.test(url))               return 'instagram'
  if (/facebook\.com|fb\.watch/i.test(url))      return 'facebook'
  if (/twitter\.com|x\.com/i.test(url))          return 'twitter'
  return null
}

async function gt(path) {
  const res = await fetch(`${GT}/${path}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(TO),
  })
  return res.json()
}

// loader.to for YouTube video (720p)
async function loaderToVideo(url) {
  const initRes = await fetch(
    `https://loader.to/ajax/download.php?format=720&url=${encodeURIComponent(url)}`,
    { signal: AbortSignal.timeout(12000) }
  )
  const init = await initRes.json()
  if (!init.success || !init.id) return null
  for (let i = 0; i < 18; i++) {
    await new Promise(r => setTimeout(r, 4000))
    try {
      const prog = await fetch(
        `https://loader.to/api/progress?id=${init.id}`,
        { signal: AbortSignal.timeout(8000) }
      ).then(r => r.json())
      if (prog.download_url) return { download_url: prog.download_url, quality: '720p' }
    } catch {}
  }
  return null
}

export async function POST(request) {
  const { url } = await request.json()
  if (!url?.trim()) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  const trimmed  = url.trim()
  const enc      = encodeURIComponent(trimmed)
  const platform = detect(trimmed)

  if (!platform) {
    return NextResponse.json(
      { error: 'Unsupported URL. Paste a YouTube, TikTok, Instagram, Facebook or Twitter link.' },
      { status: 400 }
    )
  }

  try {
    // ── TikTok via tikwm (keyless, reliable) ─────────────────────────────
    if (platform === 'tiktok') {
      const data = await fetch(
        `https://tikwm.com/api/?url=${enc}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(20000) }
      ).then(r => r.json())
      if (data.code === 0 && data.data?.play) {
        const d = data.data
        return NextResponse.json({
          platform,
          download_url: d.play,
          title: d.title, thumbnail: d.cover,
          author: d.author?.nickname || null,
          duration: d.duration ? `${d.duration}s` : null,
        })
      }
    }

    // ── YouTube via loader.to (keyless) ───────────────────────────────────
    if (platform === 'youtube') {
      // Metadata from oEmbed
      let title = null, thumbnail = null
      try {
        const meta = await fetch(
          `https://www.youtube.com/oembed?url=${enc}&format=json`,
          { signal: AbortSignal.timeout(6000) }
        ).then(r => r.json())
        title = meta.title; thumbnail = meta.thumbnail_url
      } catch {}

      const vid = await loaderToVideo(trimmed)
      if (vid?.download_url) {
        return NextResponse.json({ platform, title, thumbnail, ...vid })
      }

      // Fallback: GiftedTech ytv (works if key not exceeded)
      try {
        const d = await gt(`ytv?apikey=${KEY}&url=${enc}`)
        if (d.success && d.result?.download_url) {
          return NextResponse.json({
            platform, download_url: d.result.download_url,
            title: d.result.title, thumbnail: d.result.thumbnail,
            quality: d.result.quality, duration: d.result.duration,
          })
        }
      } catch {}
    }

    // ── Instagram ─────────────────────────────────────────────────────────
    if (platform === 'instagram') {
      const d = await gt(`instadl?apikey=${KEY}&url=${enc}`)
      if (d.success && d.result?.download_url) {
        return NextResponse.json({ platform, download_url: d.result.download_url, thumbnail: d.result.thumbnail, title: 'Instagram Reel' })
      }
    }

    // ── Facebook ──────────────────────────────────────────────────────────
    if (platform === 'facebook') {
      const d = await gt(`facebook?apikey=${KEY}&url=${enc}`)
      if (d.success && (d.result?.hd_video || d.result?.sd_video)) {
        return NextResponse.json({
          platform,
          download_url:    d.result.hd_video || d.result.sd_video,
          download_url_sd: d.result.sd_video || null,
          title: d.result.title, thumbnail: d.result.thumbnail,
          duration: d.result.duration, quality: d.result.hd_video ? 'HD' : 'SD',
        })
      }
    }

    // ── Twitter / X ───────────────────────────────────────────────────────
    if (platform === 'twitter') {
      const d = await gt(`twitter?apikey=${KEY}&url=${enc}`)
      if (d.success && d.result?.videoUrls?.length) {
        const sorted = [...d.result.videoUrls].sort((a, b) => (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0))
        return NextResponse.json({
          platform, download_url: sorted[0].url,
          thumbnail: d.result.thumbnail, quality: sorted[0].quality,
          title: 'Twitter / X Video', all_qualities: sorted,
        })
      }
    }

  } catch (e) {
    console.error('[video]', platform, e.message)
  }

  return NextResponse.json(
    { error: `Could not download from ${platform}. The service may be temporarily rate-limited — please try again in a few minutes.` },
    { status: 500 }
  )
}
