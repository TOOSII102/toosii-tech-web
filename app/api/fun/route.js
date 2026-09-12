import { NextResponse } from 'next/server'
import { partnerJoke } from '../../../lib/partnerApi'

const SOURCE_URL = 'https://official-joke-api.appspot.com/random_joke'
const SOURCE_NAME = 'Official Joke API'

export async function GET() {
  try {
    const response = await fetch(SOURCE_URL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 60 },
    })
    if (!response.ok) throw new Error(`Joke source returned ${response.status}`)

    const data = await response.json()
    return NextResponse.json({
      success: true,
      api: 'Toosii API',
      source: SOURCE_NAME,
      sourceUrl: 'https://github.com/15dkatz/official_joke_api',
      joke: {
        id: data.id || null,
        type: data.type || 'general',
        setup: data.setup || '',
        punchline: data.punchline || '',
      },
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (error) {
    console.error('[fun]', error.message)

    // Fallback: Partner API jokes.
    const partner = await partnerJoke()
    if (partner) {
      return NextResponse.json({
        success: true,
        api: 'Toosii API',
        source: 'Toosii Fallback',
        sourceUrl: 'https://apispartner2-production-3679.up.railway.app',
        joke: {
          id: null,
          type: partner.type || 'general',
          setup: partner.setup,
          punchline: partner.punchline,
        },
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      })
    }

    return NextResponse.json({
      success: false,
      api: 'Toosii API',
      error: 'Fun service is temporarily unavailable. Try again shortly.',
    }, { status: 502 })
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
