// Shared temporary image hosting for tools that need a public URL for an
// uploaded image (vision, background removal, ...). No API keys required.

const MIME_EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }

export function extForMime(mime) {
  return MIME_EXT[mime] || 'jpg'
}

export async function hostImage(bytes, mime) {
  const ext = extForMime(mime)
  const blob = () => new Blob([bytes], { type: mime || 'image/jpeg' })
  // Primary temporary host: litterbox (catbox), 1 hour TTL. Two attempts —
  // it is fast and reliable, transient failures do happen.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const fd = new FormData()
      fd.set('reqtype', 'fileupload')
      fd.set('time', '1h')
      fd.set('fileToUpload', blob(), `upload.${ext}`)
      const r = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', { method: 'POST', body: fd, signal: AbortSignal.timeout(25_000) })
      const t = (await r.text()).trim()
      if (r.ok && /^https:\/\/litter\.catbox\.moe\//.test(t)) return t
    } catch {}
  }
  // Backup host: uguu.se (pomf-style, returns a direct file URL).
  try {
    const fd = new FormData()
    fd.set('files[]', blob(), `upload.${ext}`)
    const r = await fetch('https://uguu.se/upload.php', { method: 'POST', body: fd, signal: AbortSignal.timeout(25_000) })
    const j = await r.json().catch(() => null)
    const u = j?.success && j?.files?.[0]?.url
    if (r.ok && typeof u === 'string' && u.startsWith('https://')) return u
  } catch {}
  throw new Error('The image could not be processed right now. Please try again in a moment.')
}
