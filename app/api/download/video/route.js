import { NextResponse } from 'next/server'
import { execFile }     from 'child_process'
import { promisify }    from 'util'
import { findPython3, getYtdlpPath, ytdlpJson } from '../../../../lib/ytdlp'

const execFileAsync = promisify(execFile)

const GT_BASE = 'https://api.giftedtech.co.ke/api/download'
const GT_KEY  = process.env.GIFTED_API_KEY || 'gifted'
const EP      = 'https://eliteprotech-apis.zone.id'

function detect(url) {
  if (/youtube\.com|youtu\.be/i.test(url))      return 'youtube'
  if (/tiktok\.com|vm\.tiktok\.com/i.test(url)) return 'tiktok'
  if (/instagram\.com/i.test(url))               return 'instagram'
  if (/facebook\.com|fb\.watch/i.test(url))      return 'facebook'
  if (/twitter\.com|x\.com/i.test(url))          return 'twitter'
  return null
}

async function giftedFetch(endpoint, url) {
  const res = await fetch(
    `${GT_BASE}/${endpoint}?apikey=${GT_KEY}&url=${encodeURIComponent(url)}`,
    { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(25000) }
  )
  return res.json()
}

async function youtubeViaYtdlp(url) {
  const python = await findPython3()
  const ytdlp  = getYtdlpPath()
  if (!python || !ytdlp) return null

  const info = await ytdlpJson(url)
  if (!info || !info.formats?.length) return null

  const combined = info.formats.filter(f =>
    f.vcodec && f.vcodec !== 'none' &&
    f.acodec && f.acodec !== 'none' &&
    f.ext === 'mp4'
  ).sort((a, b) => (b.height || 0) - (a.height || 0))

  const picked = combined.find(f => (f.height || 0) <= 720) || combined[0]
  if (!picked?.url) return null

  return {
    download_url: picked.url,
    title:        info.title     || null,
    thumbnail:    info.thumbnail || null,
    duration:     info.duration  ? `${info.duration}s` : null,
    quality:      picked.height  ? `${picked.height}p` : 'SD',
    platform:     'youtube',
  }
}

export async function POST(request) {
  const { url } = await request.json()
  if (!url?.trim()) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

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

    // ── TikTok — tikwm (keyless) → GiftedTech → yt-dlp ──────────────────────
    if (platform === 'tiktok') {
      // Source 1: tikwm
      try {
        const data = await fetch(
          `https://tikwm.com/api/?url=${enc}`,
          { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(15000) }
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
      } catch {}

      // Source 2: GiftedTech
      try {
        const d = await giftedFetch('tiktok', trimmed)
        if (d.success && (d.result?.video || d.result?.download_url)) {
          return NextResponse.json({
            platform,
            download_url: d.result.video || d.result.download_url,
            title: d.result.title || null,
            thumbnail: d.result.thumbnail || null,
            author: d.result.author || null,
            duration: d.result.duration || null,
          })
        }
      } catch {}

      // Source 3: yt-dlp
      try {
        const info = await ytdlpJson(trimmed)
        if (info?.url || info?.formats?.length) {
          const fmt = info.formats?.find(f => f.vcodec !== 'none' && f.acodec !== 'none') || info.formats?.[0]
          const dlUrl = info.url || fmt?.url
          if (dlUrl) {
            return NextResponse.json({
              platform,
              download_url: dlUrl,
              title: info.title || null,
              thumbnail: info.thumbnail || null,
              author: info.uploader || null,
              duration: info.duration ? `${info.duration}s` : null,
            })
          }
        }
      } catch (e) { console.error('[video:tiktok:ytdlp]', e.message) }
    }

    // ── YouTube — yt-dlp → EliteProTech → GiftedTech ─────────────────────────
    if (platform === 'youtube') {
      // Source 1: yt-dlp (highest quality, server-side)
      try {
        const ytResult = await youtubeViaYtdlp(trimmed)
        if (ytResult?.download_url) return NextResponse.json(ytResult)
      } catch (e) { console.error('[video:youtube:ytdlp]', e.message) }

      // Source 2: EliteProTech ytmp4
      try {
        const ep = await fetch(
          `${EP}/ytmp4?url=${encodeURIComponent(trimmed)}`,
          { signal: AbortSignal.timeout(25000) }
        ).then(r => r.json())
        if (ep.status && ep.result?.url) {
          return NextResponse.json({
            platform,
            download_url: ep.result.url,
            title:     ep.result.title || null,
            quality:   'MP4',
            size:      ep.result.size  || null,
          })
        }
      } catch (e) { console.error('[video:youtube:eliteprotech]', e.message) }

      // Source 3: GiftedTech
      try {
        const d = await giftedFetch('ytv', trimmed)
        if (d.success && d.result?.download_url) {
          return NextResponse.json({
            platform,
            download_url: d.result.download_url,
            title: d.result.title, thumbnail: d.result.thumbnail,
            quality: d.result.quality, duration: d.result.duration,
          })
        }
      } catch {}
    }

    // ── Instagram — GiftedTech → EliteProTech → yt-dlp ──────────────────────
    if (platform === 'instagram') {
      // Source 1: GiftedTech
      try {
        const d = await giftedFetch('instadl', trimmed)
        if (d.success && d.result?.download_url) {
          return NextResponse.json({
            platform,
            download_url: d.result.download_url,
            thumbnail: d.result.thumbnail,
            title: d.result.title || 'Instagram Video',
          })
        }
      } catch {}

      // Source 2: EliteProTech /instagram
      try {
        const ep = await fetch(
          `${EP}/instagram?url=${enc}`,
          { signal: AbortSignal.timeout(20000) }
        ).then(r => r.json())
        const igUrl = ep?.video || ep?.result?.url || ep?.url || ep?.data?.[0]?.url
        if ((ep?.status || ep?.success) && igUrl) {
          return NextResponse.json({
            platform,
            download_url: igUrl,
            title: ep.result?.title || 'Instagram Video',
            thumbnail: ep.result?.thumbnail || null,
          })
        }
      } catch (e) { console.error('[video:instagram:eliteprotech]', e.message) }

      // Source 3: yt-dlp
      try {
        const info = await ytdlpJson(trimmed)
        const fmt = info?.formats?.find(f => f.vcodec !== 'none' && f.acodec !== 'none') || info?.formats?.[0]
        const dlUrl = info?.url || fmt?.url
        if (dlUrl) {
          return NextResponse.json({
            platform,
            download_url: dlUrl,
            title: info.title || 'Instagram Video',
            thumbnail: info.thumbnail || null,
          })
        }
      } catch (e) { console.error('[video:instagram:ytdlp]', e.message) }
    }

    // ── Facebook — EP/facebook → EP/facebook1 → GiftedTech → yt-dlp ─────────
    if (platform === 'facebook') {
      // Source 1: EliteProTech /facebook — returns {success, video:"url"}
      try {
        const ep = await fetch(
          `${EP}/facebook?url=${enc}`,
          { signal: AbortSignal.timeout(20000) }
        ).then(r => r.json())
        const vidUrl = ep.video || ep.result?.hd || ep.result?.sd || ep.result?.url
        if (ep.success && vidUrl) {
          return NextResponse.json({
            platform,
            download_url: vidUrl,
            title:     ep.title     || ep.result?.title    || null,
            thumbnail: ep.thumbnail || ep.result?.thumbnail || null,
            quality: 'HD',
          })
        }
      } catch (e) { console.error('[video:facebook:ep1]', e.message) }

      // Source 2: EliteProTech /facebook1 — returns {success, results:[{quality,url}]}
      try {
        const ep2 = await fetch(
          `${EP}/facebook1?url=${enc}`,
          { signal: AbortSignal.timeout(20000) }
        ).then(r => r.json())
        if (ep2.success && ep2.results?.length) {
          const hd = ep2.results.find(r => /hd|720|1080/i.test(r.quality)) || ep2.results[0]
          const sd = ep2.results.find(r => /sd|360|480/i.test(r.quality))
          if (hd?.url) {
            return NextResponse.json({
              platform,
              download_url:    hd.url,
              download_url_sd: sd?.url || null,
              title:    ep2.title    || null,
              quality:  hd.quality   || 'HD',
            })
          }
        }
      } catch (e) { console.error('[video:facebook:ep2]', e.message) }

      // Source 3: GiftedTech
      try {
        const d = await giftedFetch('facebook', trimmed)
        if (d.success && (d.result?.hd_video || d.result?.sd_video)) {
          return NextResponse.json({
            platform,
            download_url:    d.result.hd_video || d.result.sd_video,
            download_url_sd: d.result.sd_video || null,
            title: d.result.title, thumbnail: d.result.thumbnail,
            duration: d.result.duration, quality: d.result.hd_video ? 'HD' : 'SD',
          })
        }
      } catch {}

      // Source 3: yt-dlp
      try {
        const info = await ytdlpJson(trimmed)
        const fmt = info?.formats?.find(f => f.vcodec !== 'none' && f.acodec !== 'none') || info?.formats?.[0]
        const dlUrl = info?.url || fmt?.url
        if (dlUrl) {
          return NextResponse.json({
            platform,
            download_url: dlUrl,
            title: info.title || null,
            thumbnail: info.thumbnail || null,
          })
        }
      } catch (e) { console.error('[video:facebook:ytdlp]', e.message) }
    }

    // ── Twitter / X — EP/x → GiftedTech → yt-dlp ────────────────────────────
    if (platform === 'twitter') {
      // Source 1: EliteProTech /x — returns {status:"success", videos:[{url}], thumbnail}
      try {
        const ep = await fetch(
          `${EP}/x?url=${enc}`,
          { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(20000) }
        ).then(r => r.json())
        if (ep.status === 'success' && ep.videos?.length) {
          const best = ep.videos[0]
          return NextResponse.json({
            platform,
            download_url: best.url,
            thumbnail: ep.thumbnail || null,
            quality: best.label || 'HD',
            title: 'Twitter / X Video',
          })
        }
      } catch (e) { console.error('[video:twitter:eliteprotech]', e.message) }

      // Source 2: GiftedTech
      try {
        const d = await giftedFetch('twitter', trimmed)
        if (d.success && d.result?.videoUrls?.length) {
          const sorted = [...d.result.videoUrls].sort(
            (a, b) => (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0)
          )
          return NextResponse.json({
            platform,
            download_url: sorted[0].url,
            thumbnail: d.result.thumbnail,
            quality: sorted[0].quality,
            title: 'Twitter / X Video',
            all_qualities: sorted,
          })
        }
      } catch {}

      // Source 3: yt-dlp
      try {
        const info = await ytdlpJson(trimmed)
        const fmt = info?.formats?.find(f => f.vcodec !== 'none' && f.acodec !== 'none') || info?.formats?.[0]
        const dlUrl = info?.url || fmt?.url
        if (dlUrl) {
          return NextResponse.json({
            platform,
            download_url: dlUrl,
            title: info.title || 'Twitter / X Video',
            thumbnail: info.thumbnail || null,
          })
        }
      } catch (e) { console.error('[video:twitter:ytdlp]', e.message) }
    }

  } catch (e) {
    console.error('[video]', platform, e.message)
  }

  return NextResponse.json(
    { error: `Could not download from ${platform}. The service may be temporarily rate-limited — please try again in a few minutes.` },
    { status: 500 }
  )
}
