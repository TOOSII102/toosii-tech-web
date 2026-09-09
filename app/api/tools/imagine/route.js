import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const KAALIX = 'https://r-bots-free-apis.co08.art'
const MAX_W = 1280
const MAX_H = 1280

function clampDimension(value, fallback) {
  const n = Number.parseInt(value, 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(n, 256), value === undefined ? fallback : MAX_W)
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const prompt = String(body.prompt || '').trim()
    if (!prompt) return NextResponse.json({ error: 'Describe the image you want first.' }, { status: 400 })
    if (prompt.length > 500) return NextResponse.json({ error: 'Keep the description under 500 characters.' }, { status: 400 })

    const width = clampDimension(body.width, 1024)
    const height = clampDimension(body.height, 1024)
    const qs = new URLSearchParams({ width: String(width), height: String(height), nologo: 'true', enhance: 'true' })
    const url = `${KAALIX}/api/pollinations/prompt/${encodeURIComponent(prompt)}?${qs.toString()}`

    const upstream = await fetch(url, { signal: AbortSignal.timeout(55_000), headers: { Accept: 'image/*' } })
    const contentType = upstream.headers.get('content-type') || ''
    if (!upstream.ok || !contentType.startsWith('image/')) {
      throw new Error('Image generator is busy — try again in a few seconds.')
    }
    const bytes = Buffer.from(await upstream.arrayBuffer())
    if (!bytes.length) throw new Error('Image generator returned an empty image.')

    const base64 = bytes.toString('base64')
    return NextResponse.json({
      image: `data:${contentType.split(';')[0]};base64,${base64}`,
      prompt,
      width,
      height,
      source: 'Toosii Tech',
    })
  } catch (e) {
    console.error('[imagine]', e.message)
    return NextResponse.json({ error: e.message.startsWith('Image generator') ? e.message : 'Generation failed. Please try again.' }, { status: 502 })
  }
}
