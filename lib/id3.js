import NodeID3 from 'node-id3'

async function fetchCoverArt(url) {
  if (!url || !/^https?:\/\//i.test(url)) return null

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'image/*' },
      signal: AbortSignal.timeout(10000),
      cache: 'no-store',
    })
    if (!response.ok) return null

    const mime = response.headers.get('content-type') || 'image/jpeg'
    if (!mime.toLowerCase().startsWith('image/')) return null

    const imageBuffer = Buffer.from(await response.arrayBuffer())
    if (!imageBuffer.length || imageBuffer.length > 8 * 1024 * 1024) return null
    return { mime: mime.split(';')[0], imageBuffer }
  } catch (error) {
    console.error('[id3:cover-art]', error.message)
    return null
  }
}

export async function tagMp3Buffer(buffer, metadata = {}) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) return buffer

  const title = String(metadata.title || 'Audio').trim()
  const artist = String(metadata.artist || metadata.author || 'Toosii').trim()
  const album = String(metadata.album || 'Toosii Downloads').trim()
  const tags = {
    title,
    artist,
    performerInfo: artist,
    album,
    genre: 'Pop',
    comment: {
      language: 'eng',
      text: 'Downloaded with Toosii Tech',
    },
  }

  const coverArt = await fetchCoverArt(metadata.thumbnail)
  if (coverArt) {
    tags.image = {
      mime: coverArt.mime,
      type: { id: 3 },
      description: 'Front cover',
      imageBuffer: coverArt.imageBuffer,
    }
  }

  try {
    const tagged = NodeID3.write(tags, buffer)
    return Buffer.isBuffer(tagged) ? tagged : buffer
  } catch (error) {
    console.error('[id3:write]', error.message)
    return buffer
  }
}
