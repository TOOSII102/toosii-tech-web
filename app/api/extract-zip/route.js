import AdmZip from 'adm-zip'
import { NextResponse } from 'next/server'

const MAX_FILE_CHARS = 8_000
const MAX_TOTAL_CHARS = 80_000
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
    const zip = new AdmZip(buffer)
    const entries = zip.getEntries()

    const files = []
    const skipped = []
    let totalChars = 0

    for (const entry of entries) {
      if (entry.isDirectory) continue
      const name = entry.entryName
      if (shouldSkip(name)) { skipped.push(name); continue }
      if (isBinary(name)) { skipped.push(name); continue }
      if (totalChars >= MAX_TOTAL_CHARS) { skipped.push(name); continue }

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
