import { NextResponse } from 'next/server'
import { hostImage } from '../../../../lib/imageHost'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const KAALIX = 'https://r-bots-free-apis.co08.art'
const MAX_IMAGE_BYTES = 8 * 1024 * 1024

export async function POST(req) {
  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Upload an image to remove its background.' }, { status: 400 })
    }
    const mime = file.type || 'image/jpeg'
    if (!mime.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are supported.' }, { status: 400 })
    }
    const bytes = Buffer.from(await file.arrayBuffer())
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'That image is too large — please upload one under 8 MB.' }, { status: 400 })
    }

    const imageUrl = await hostImage(bytes, mime)
    const upstream = await fetch(`${KAALIX}/api/removebg?url=${encodeURIComponent(imageUrl)}`, {
      signal: AbortSignal.timeout(45_000),
      headers: { Accept: 'image/*' },
    })
    const contentType = upstream.headers.get('content-type') || ''
    if (!upstream.ok || !contentType.startsWith('image/')) {
      throw new Error('Background removal is busy — try again in a few seconds.')
    }
    const result = Buffer.from(await upstream.arrayBuffer())
    if (!result.length) throw new Error('Background removal returned an empty image.')

    return new Response(result, {
      headers: {
        'Content-Type': contentType.split(';')[0] || 'image/png',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('[remove-bg]', e.message)
    const known = e.message.startsWith('Background removal') || e.message.startsWith('The image')
    return NextResponse.json({ error: known ? e.message : 'Background removal failed. Please try again.' }, { status: 502 })
  }
}
