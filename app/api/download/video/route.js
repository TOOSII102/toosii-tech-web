import { NextResponse } from 'next/server'
import ytdl from '@distube/ytdl-core'

const GT_BASE = 'https://api.giftedtech.co.ke/api/download'
const GT_KEY  = 'gifted'
const TIMEOUT = 25000

function detectPlatform(url) {
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube'
  if (/tiktok\.com|vm\.tiktok\.com/i.test(url)) return 'tiktok'
  if (/instagram\.com/i.test(url)) return 'instagram'
  if (/facebook\.com|fb\.watch/i.test(url)) return 'facebook'
  if (/twitter\.com|x\.com/i.test(url)) return 'twitter'
  return 'unknown'
}

async function gtFetch(path) {
  const res = await fetch(`${GT_BASE}/${path}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(TIMEOUT),
  })
  return res.json()
}

export async function POST(request) {
  const { url } = await request.json()
  if (!url?.trim()) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  const trimmed = url.trim()
  const platform = detectPlatform(trimmed)
  const enc = encodeURIComponent(trimmed)

  try {
    if (platform === 'youtube') {
      // Primary: ytdl-core (fastest, no rate limit)
      if (ytdl.validateURL(trimmed)) {
        try {
          const info = await ytdl.getInfo(trimmed, {
            requestOptions: { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
          })
          const mp4 = info.formats
            .filter(f => f.container === 'mp4' && f.hasVideo && f.hasAudio)
            .sort((a, b) => (b.height || 0) - (a.height || 0))[0]
            || info.formats
              .filter(f => f.container === 'mp4' && f.hasVideo)
              .sort((a, b) => (b.height || 0) - (a.height || 0))[0]

          if (mp4?.url) {
            const vd = info.videoDetails
            return NextResponse.json({
              platform: 'youtube',
              download_url: mp4.url,
              title: vd.title,
              thumbnail: vd.thumbnails?.at(-1)?.url || null,
              quality: mp4.qualityLabel || `${mp4.height}p`,
              size: mp4.contentLength ? `${(+mp4.contentLength / 1048576).toFixed(1)} MB` : null,
              author: vd.author?.name || null,
            })
          }
        } catch (e) { console.error('[ytdl-core]', e.message) }
      }

      // Fallback: GiftedTech ytv
      const d = await gtFetch(`ytv?apikey=${GT_KEY}&url=${enc}`)
      if (d.success && d.result?.download_url) {
        return NextResponse.json({
          platform: 'youtube',
          download_url: d.result.download_url,
          title: d.result.title,
          thumbnail: d.result.thumbnail,
          quality: d.result.quality,
          duration: d.result.duration,
        })
      }
    }

    if (platform === 'tiktok') {
      const d = await gtFetch(`tiktok?apikey=${GT_KEY}&url=${enc}`)
      if (d.success && d.result?.video) {
        return NextResponse.json({
          platform: 'tiktok',
          download_url: d.result.video,
          title: d.result.title,
          thumbnail: d.result.cover,
          author: d.result.author?.name || null,
          duration: d.result.duration ? `${d.result.duration}s` : null,
        })
      }
    }

    if (platform === 'instagram') {
      const d = await gtFetch(`instadl?apikey=${GT_KEY}&url=${enc}`)
      if (d.success && d.result?.download_url) {
        return NextResponse.json({
          platform: 'instagram',
          download_url: d.result.download_url,
          thumbnail: d.result.thumbnail,
          title: 'Instagram Reel',
        })
      }
    }

    if (platform === 'facebook') {
      const d = await gtFetch(`facebook?apikey=${GT_KEY}&url=${enc}`)
      if (d.success && (d.result?.hd_video || d.result?.sd_video)) {
        return NextResponse.json({
          platform: 'facebook',
          download_url: d.result.hd_video || d.result.sd_video,
          download_url_sd: d.result.sd_video || null,
          title: d.result.title,
          thumbnail: d.result.thumbnail,
          duration: d.result.duration,
          quality: d.result.hd_video ? 'HD' : 'SD',
        })
      }
    }

    if (platform === 'twitter') {
      const d = await gtFetch(`twitter?apikey=${GT_KEY}&url=${enc}`)
      if (d.success && d.result?.videoUrls?.length) {
        const best = d.result.videoUrls.sort((a, b) => {
          const h = q => parseInt(q.quality) || 0
          return h(b) - h(a)
        })[0]
        return NextResponse.json({
          platform: 'twitter',
          download_url: best.url,
          thumbnail: d.result.thumbnail,
          quality: best.quality,
          title: 'Twitter / X Video',
          all_qualities: d.result.videoUrls,
        })
      }
    }

  } catch (e) {
    console.error('[download/video]', e.message)
  }

  return NextResponse.json(
    { error: `Could not download from ${platform === 'unknown' ? 'this URL' : platform}. Check the link and try again.` },
    { status: 500 }
  )
}
