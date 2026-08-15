import { NextResponse } from 'next/server'

const OPENALEX_BASE = 'https://api.openalex.org/works'
const SOURCE_NAME = 'OpenAlex'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query = (searchParams.get('q') || 'climate technology').trim()
  const requestedLimit = Number.parseInt(searchParams.get('limit') || '5', 10)
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 10) : 5

  if (query.length < 2 || query.length > 160) {
    return NextResponse.json({
      success: false,
      api: 'Toosii API',
      error: 'The education search query must be between 2 and 160 characters.',
    }, { status: 400 })
  }

  try {
    const url = new URL(OPENALEX_BASE)
    url.searchParams.set('search', query)
    url.searchParams.set('per-page', String(limit))
    url.searchParams.set('select', 'id,title,publication_year,doi,primary_location,cited_by_count,authorships,open_access')

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
      next: { revalidate: 300 },
    })
    if (!response.ok) throw new Error(`OpenAlex returned ${response.status}`)

    const data = await response.json()
    const results = (data.results || []).map(work => ({
      id: work.id,
      title: work.title,
      publicationYear: work.publication_year,
      doi: work.doi || null,
      url: work.primary_location?.landing_page_url || work.doi || work.id,
      openAccessUrl: work.primary_location?.pdf_url || work.open_access?.oa_url || null,
      citedByCount: work.cited_by_count || 0,
      authors: (work.authorships || []).slice(0, 5).map(item => item.author?.display_name).filter(Boolean),
    }))

    return NextResponse.json({
      success: true,
      api: 'Toosii API',
      source: SOURCE_NAME,
      sourceUrl: 'https://openalex.org/',
      query,
      count: results.length,
      results,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('[education]', error.message)
    return NextResponse.json({
      success: false,
      api: 'Toosii API',
      error: 'Education search is temporarily unavailable. Try again shortly.',
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
