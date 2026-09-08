import AdmZip from 'adm-zip'
import { NextResponse } from 'next/server'

const MAX_FILE_CHARS = 8_000
const MAX_TOTAL_CHARS = 80_000
// Hard caps to stop zip-bomb / memory-exhaustion uploads. adm-zip decompresses an
// entry fully into memory, so an unchecked 1 MB archive can expand to gigabytes.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024      // 10 MB compressed upload
const MAX_ENTRY_BYTES = 5 * 1024 * 1024        // 5 MB per decompressed entry
const MAX_TOTAL_UNCOMPRESSED_BYTES = 50 * 1024 * 1024 // 50 MB total decompressed
const MAX_ENTRIES = 2_000
const BINARY_EXTS = new Set(['.png','.jpg','.jpeg','.gif','.webp','.svg','.ico','.bmp','.mp4','.mp3','.wav','.zip','.gz','.tar','.rar','.7z','.pdf','.ttf','.woff','.woff2','.eot','.otf','.exe','.dll','.so','.dylib','.bin','.lock'])
const SKIP_DIRS = new Set(['node_modules','.git','dist','build','.next','out','coverage','.cache','.turbo'])

function isBinary(name) {
  const ext = '.' + name.split('.').pop().toLowerCase()
  return BINARY_EXTS.has(ext)
}
function shouldSkip(entryPath) {
  return entryPath.split('/').some(p => SKIP_DIRS.has(p))
}

export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    if (!file.name.endsWith('.zip')) return NextResponse.json({ error: 'Only .zip files are supported' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.length > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `Zip is too large. Maximum upload size is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.` },
        { status: 413 },
      )
    }

    const zip = new AdmZip(buffer)
    const entries = zip.getEntries()

    if (entries.length > MAX_ENTRIES) {
      return NextResponse.json(
        { error: `Zip contains too many entries (limit ${MAX_ENTRIES}).` },
        { status: 413 },
      )
    }

    // Reject archives whose declared uncompressed size is implausible before we
    // decompress anything at all.
    const declaredTotal = entries.reduce((sum, e) => sum + (e.header?.size || 0), 0)
    if (declaredTotal > MAX_TOTAL_UNCOMPRESSED_BYTES) {
      return NextResponse.json(
        { error: 'Zip expands to too much data (possible zip bomb).' },
        { status: 413 },
      )
    }

    const files = []
    const skipped = []
    let totalChars = 0

    for (const entry of entries) {
      if (entry.isDirectory) continue
      const name = entry.entryName
      if (shouldSkip(name)) { skipped.push(name); continue }
      if (isBinary(name)) { skipped.push(name); continue }
      if (totalChars >= MAX_TOTAL_CHARS) { skipped.push(name); continue }
      // Skip oversized entries without decompressing them.
      if ((entry.header?.size || 0) > MAX_ENTRY_BYTES) { skipped.push(name); continue }

      let content
      try { content = entry.getData().toString('utf8') } catch { skipped.push(name); continue }

      let truncated = false
      if (content.length > MAX_FILE_CHARS) { content = content.slice(0, MAX_FILE_CHARS); truncated = true }
      totalChars += content.length
      files.push({ path: name, content, truncated })
    }

    return NextResponse.json({ files, skipped }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  } catch (err) {
    console.error('extract-zip error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to extract zip' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}
