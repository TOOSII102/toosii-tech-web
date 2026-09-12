import { apiError, apiResponse, optionsResponse } from '../../../../lib/publicApi'
import { partnerBibleSearch, PARTNER_API_NAME } from '../../../../lib/partnerApi'

export async function GET(request) {
  const q = (new URL(request.url).searchParams.get('q') || '').trim()

  if (!q) {
    return apiError('Pass a book and reference in ?q= — for example "john 3:16" or "psalm 23".', {
      code: 'MISSING_REFERENCE',
    })
  }
  if (q.length > 80) {
    return apiError('Reference is too long.', { code: 'REFERENCE_TOO_LONG' })
  }

  const result = await partnerBibleSearch(q)
  if (!result) {
    return apiError(`No verses found for "${q}". Try a format like "john 3:16" or "psalm 23".`, {
      status: 404,
      code: 'VERSE_NOT_FOUND',
    })
  }

  return apiResponse({
    operation: 'spiritual.bible',
    source: PARTNER_API_NAME,
    ...result,
  }, { cacheControl: 'public, max-age=86400, s-maxage=604800' })
}

export async function OPTIONS() {
  return optionsResponse()
}
