import { NextResponse } from 'next/server'
import { partnerImageGeneration } from '../../../../lib/partnerApi'
import { hubImageGeneration } from '../../../../lib/apiHub'

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

    try {
      const upstream = await fetch(url, { signal: AbortSignal.timeout(55_000), headers: { Accept: 'image/*' } })
      const contentType = upstream.headers.get('content-type') || ''
      if (upstream.ok && contentType.startsWith('image/')) {
        const bytes = Buffer.from(await upstream.arrayBuffer())
        if (bytes.length) {
          return NextResponse.json({
            image: `data:${contentType.split(';')[0]};base64,${bytes.toString('base64')}`,
            prompt,
            width,
            height,
            source: 'Toosii Tech',
          })
        }
      }
    } catch (e) {
      console.error('[imagine:primary]', e.message)
    }

    // Fallback: Partner AI image generators (Flux → Magic Studio → text2img).
    const partner = await partnerImageGeneration(prompt)
    if (partner?.image) {
      return NextResponse.json({
        image: partner.image,
        prompt,
        width,
        height,
        source: 'Toosii Tech',
      })
    }

    // Fallback: API hub image generators (Flux → DALL·E → Ideogram → Bing).
    const hub = await hubImageGeneration(prompt)
    if (hub?.image) {
      return NextResponse.json({
        image: hub.image,
        prompt,
        width,
        height,
        source: 'Toosii Tech',
      })
    }

    return NextResponse.json(
      { error: 'Image generator is busy — try again in a few seconds.' },
      { status: 502 },
    )
  } catch (e) {
    console.error('[imagine]', e.message)
    return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 502 })
  }
}
