import { NextResponse } from 'next/server'
import ytdl from '@distube/ytdl-core'

const GT  = 'https://api.giftedtech.co.ke/api/download'
const KEY = 'gifted'
const TO  = 25000

function detect(url) {
  if (/youtube\.com|youtu\.be/i.test(url))      return 'youtube'
  if (/tiktok\.com|vm\.tiktok\.com/i.test(url)) return 'tiktok'
  if (/instagram\.com/i.test(url))               return 'instagram'
  if (/facebook\.com|fb\.watch/i.test(url))      return 'facebook'
  if (/twitter\.com|x\.com/i.test(url))          return 'twitter'
  return 'unknown'
}

async function gt(path) {
  const res = await fetch(`${GT}/${path}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(TO),
  })
  return res.json()
}

export async function POST(request) {
  const { url } = await request.json()
  if (!url?.trim()) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  const trimmed = url.trim()
  const enc     = encodeURIComponent(trimmed)
  const platform = detect(trimmed)

  try {
    // ── YouTube ──────────────────────────────────────────────────────────
    if (platform === 'youtube') {
      // Primary: GiftedTech ytv (returns stable CDN link)
      try {
        const d = await gt(`ytv?apikey=${KEY}&url=${enc}`)
        if (d.success && d.result?.download_url) {
          return NextResponse.json({
            platform,
            download_url: d.result.download_url,
            title:     d.result.title,
            thumbnail: d.result.thumbnail,
            quality:   d.result.quality,
            duration:  d.result.duration,
          })
        }
      } catch (e) { console.error('[gt-ytv]', e.message) }

      // Fallback: ytdl-core
      if (ytdl.validateURL(trimmed)) {
        try {
          const info = await ytdl.getInfo(trimmed)
          const fmt = [
            ...info.formats.filter(f => f.container === 'mp4' && f.hasVideo && f.hasAudio),
            ...info.formats.filter(f => f.container === 'mp4' && f.hasVideo),
          ].filter(f => f.url).sort((a, b) => (b.height || 0) - (a.height || 0))[0]

          if (fmt?.url) {
            const vd = info.videoDetails
            return NextResponse.json({
              platform,
              download_url: fmt.url,
              title: vd.title,
              thumbnail: vd.thumbnails?.at(-1)?.url || null,
              quality: fmt.qualityLabel || `${fmt.height}p`,
              size: fmt.contentLength ? `${(+fmt.contentLength / 1048576).toFixed(1)} MB` : null,
              author: vd.author?.name || null,
            })
          }
        } catch (e) { console.error('[ytdl-core]', e.message) }
      }
    }

    // ── TikTok ───────────────────────────────────────────────────────────
    if (platform === 'tiktok') {
      const d = await gt(`tiktok?apikey=${KEY}&url=${enc}`)
      if (d.success && d.result?.video) {
        return NextResponse.json({
          platform,
          download_url: d.result.video,
          title:     d.result.title,
          thumbnail: d.result.cover,
          author:    d.result.author?.name || null,
          duration:  d.result.duration ? `${d.result.duration}s` : null,
        })
      }
    }

    // ── Instagram ────────────────────────────────────────────────────────
    if (platform === 'instagram') {
      const d = await gt(`instadl?apikey=${KEY}&url=${enc}`)
      if (d.success && d.result?.download_url) {
        return NextResponse.json({
          platform,
          download_url: d.result.download_url,
          thumbnail: d.result.thumbnail,
          title: 'Instagram Reel',
        })
      }
    }

    // ── Facebook ─────────────────────────────────────────────────────────
    if (platform === 'facebook') {
      const d = await gt(`facebook?apikey=${KEY}&url=${enc}`)
      if (d.success && (d.result?.hd_video || d.result?.sd_video)) {
        return NextResponse.json({
          platform,
          download_url:    d.result.hd_video || d.result.sd_video,
          download_url_sd: d.result.sd_video || null,
          title:     d.result.title,
          thumbnail: d.result.thumbnail,
          duration:  d.result.duration,
          quality:   d.result.hd_video ? 'HD' : 'SD',
        })
      }
    }

    // ── Twitter / X ──────────────────────────────────────────────────────
    if (platform === 'twitter') {
      const d = await gt(`twitter?apikey=${KEY}&url=${enc}`)
      if (d.success && d.result?.videoUrls?.length) {
        const sorted = [...d.result.videoUrls].sort((a, b) => (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0))
        return NextResponse.json({
          platform,
          download_url:   sorted[0].url,
          thumbnail:      d.result.thumbnail,
          quality:        sorted[0].quality,
          title:          'Twitter / X Video',
          all_qualities:  sorted,
        })
      }
    }

  } catch (e) {
    console.error('[download/video]', platform, e.message)
  }

  const label = platform === 'unknown' ? 'this URL' : platform
  return NextResponse.json(
    { error: `Could not download from ${label}. Check the link and try again.` },
    { status: 500 }
  )
}
