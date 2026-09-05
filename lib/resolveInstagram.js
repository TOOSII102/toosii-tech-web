import { ytdlpJson } from './ytdlp'

const GT_BASE = 'https://api.giftedtech.co.ke/api/download'
const GT_KEY  = process.env.GIFTED_API_KEY || 'gifted'
const EP      = 'https://eliteprotech-apis.zone.id'
const KEITH_BASE = 'https://apiskeith2-production-3020.up.railway.app'
const KEITH_PATHS = ['/download/video', '/download/ytmp4', '/download/dlmp4', '/download/mp4']

async function keithFetch(url) {
  for (const path of KEITH_PATHS) {
    try {
      const res = await fetch(
        `${KEITH_BASE}${path}?url=${encodeURIComponent(url)}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(20000) }
      )
      if (!res.ok) continue
      const data = await res.json()
      if (data?.status && typeof data.result === 'string' && /^https?:\/\//.test(data.result)) {
        return { download_url: data.result }
      }
    } catch { /* try next path */ }
  }
  return null
}

/**
 * Resolves an Instagram post/reel URL to a direct, fetchable video link. Tries Keith
 * first (fast, keyless), then GiftedTech, EliteProTech, and finally yt-dlp.
 *
 * IMPORTANT: Instagram's CDN links are signed with short-lived tokens. Call this
 * immediately before you're going to fetch the result — don't resolve once and cache
 * the URL for later, or it may have expired by the time it's actually used (this was
 * the root cause of intermittent "download saved as a broken file" failures).
 */
export async function resolveInstagramDownloadUrl(originalUrl) {
  const enc = encodeURIComponent(originalUrl)

  try {
    const keith = await keithFetch(originalUrl)
    if (keith?.download_url) return { download_url: keith.download_url, title: 'Instagram Video' }
  } catch (e) { console.error('[resolveInstagram:keith]', e.message) }

  try {
    const res = await fetch(
      `${GT_BASE}/instadl?apikey=${GT_KEY}&url=${enc}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(25000) }
    )
    const d = await res.json()
    if (d.success && d.result?.download_url) {
      return { download_url: d.result.download_url, title: d.result.title || 'Instagram Video', thumbnail: d.result.thumbnail }
    }
  } catch (e) { console.error('[resolveInstagram:giftedtech]', e.message) }

  try {
    const ep = await fetch(`${EP}/instagram?url=${enc}`, { signal: AbortSignal.timeout(20000) }).then(r => r.json())
    const igUrl = ep?.video || ep?.result?.url || ep?.url || ep?.data?.[0]?.url
    if ((ep?.status || ep?.success) && igUrl) {
      return { download_url: igUrl, title: ep.result?.title || 'Instagram Video', thumbnail: ep.result?.thumbnail || null }
    }
  } catch (e) { console.error('[resolveInstagram:eliteprotech]', e.message) }

  try {
    const info = await ytdlpJson(originalUrl)
    const fmt = info?.formats?.find(f => f.vcodec !== 'none' && f.acodec !== 'none') || info?.formats?.[0]
    const dlUrl = info?.url || fmt?.url
    if (dlUrl) return { download_url: dlUrl, title: info.title || 'Instagram Video', thumbnail: info.thumbnail || null }
  } catch (e) { console.error('[resolveInstagram:ytdlp]', e.message) }

  return null
}
