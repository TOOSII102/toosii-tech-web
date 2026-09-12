import { apiError, apiResponse, optionsResponse, readTextParam } from '../../../../../lib/publicApi'
import { partnerBooks } from '../../../../../lib/partnerApi'

function readLimit(value) {
  if (!value) return 5
  if (!/^\d+$/.test(value)) return null

  const limit = Number(value)
  return limit >= 1 && limit <= 10 ? limit : null
}

export async function GET(request) {
  const query = readTextParam(request, 'query', 160)
  if (query.error) return apiError(query.error)

  const limit = readLimit(new URL(request.url).searchParams.get('limit'))
  if (!limit) {
    return apiError('limit must be a whole number between 1 and 10.', { code: 'INVALID_LIMIT' })
  }

  const upstream = new URL('https://openlibrary.org/search.json')
  upstream.search = new URLSearchParams({
    q: query.value,
    limit: String(limit),
    fields: 'key,title,author_name,first_publish_year,cover_i,edition_count,language',
  }).toString()

  try {
    const response = await fetch(upstream, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ToosiiAPI/1.0 (https://toosii-tech-web-git-main-jeshis-projects-0b108922.vercel.app/api)',
      },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(9000),
    })

    if (!response.ok) {
      throw new Error(`Open Library ${response.status}`)
    }

    const data = await response.json()
    const results = Array.isArray(data.docs) ? data.docs.map(book => ({
      key: book.key || null,
      title: book.title || 'Untitled',
      authors: book.author_name || [],
      firstPublishYear: book.first_publish_year || null,
      editionCount: book.edition_count || 0,
      languages: book.language || [],
      coverUrl: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null,
    })) : []

    if (results.length) {
      return apiResponse({
        operation: 'books.search',
        source: 'Open Library',
        query: query.value,
        count: results.length,
        totalMatches: data.numFound || data.num_found || 0,
        results,
      }, { cacheControl: 'public, max-age=60, s-maxage=300' })
    }
    throw new Error('Open Library returned no docs')
  } catch {
    // Fallback: Partner API book search.
    const partner = await partnerBooks(query.value)
    if (partner) {
      return apiResponse({
        operation: 'books.search',
        source: 'Toosii Fallback',
        query: query.value,
        count: Math.min(partner.length, limit),
        totalMatches: partner.length,
        results: partner.slice(0, limit),
      }, { cacheControl: 'public, max-age=60, s-maxage=300' })
    }

    return apiError('The book search source did not respond in time.', {
      status: 504,
      code: 'UPSTREAM_TIMEOUT',
    })
  }
}

export async function OPTIONS() {
  return optionsResponse()
}
