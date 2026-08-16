const REFERENCE_API_BASE = 'https://apiskeith2-production-3020.up.railway.app'

const ROUTES = {
  audio: ['audio', 'ytmp3', 'mp3', 'yta'],
  video: ['video', 'mp4', 'ytmp4'],
  tiktok: ['tiktokdl3'],
  instagram: ['instadl', 'instagramdl'],
  facebook: ['fbdown', 'fbdl'],
  twitter: ['twitter'],
  pinterest: ['pinterest', 'pindl2', 'pindl3'],
  spotify: ['spotify'],
  soundcloud: ['soundcloud'],
}

function findUrl(value) {
  if (typeof value === 'string' && /^https?:\/\//i.test(value)) return value
  if (!value || typeof value !== 'object') return null

  const keys = ['download_url', 'download', 'url', 'video', 'audio', 'mp3', 'mp4', 'hd', 'sd']
  for (const key of keys) {
    const found = findUrl(value[key])
    if (found) return found
  }

  for (const valueItem of Object.values(value)) {
    const found = findUrl(valueItem)
    if (found) return found
  }

  return null
}

export async function referenceDownload(url, kind, options = {}) {
  const routes = options.routes || ROUTES[kind] || []
  if (!url || !routes.length) return null

  for (const route of routes) {
    try {
      const response = await fetch(
        `${REFERENCE_API_BASE}/download/${route}?url=${encodeURIComponent(url)}`,
        {
          headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(options.timeout || 30000),
          cache: 'no-store',
        },
      )
      if (!response.ok) continue

      const payload = await response.json().catch(() => null)
      const downloadUrl = findUrl(payload?.result) || findUrl(payload?.data) || findUrl(payload)
      if (!downloadUrl) continue

      return {
        download_url: downloadUrl,
        quality: kind === 'audio' || kind === 'spotify' ? 'MP3' : null,
        route,
      }
    } catch (error) {
      console.error(`[reference-download:${route}]`, error.message)
    }
  }

  return null
}

export { REFERENCE_API_BASE, ROUTES }
