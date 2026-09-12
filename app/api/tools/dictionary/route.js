import { apiError, apiResponse, optionsResponse } from '../../../../lib/publicApi'
import { partnerDictionary, PARTNER_API_NAME } from '../../../../lib/partnerApi'

export async function GET(request) {
  const q = (new URL(request.url).searchParams.get('q') || '').trim()

  if (!q) {
    return apiError('Pass a word to look up in ?q=.', { code: 'MISSING_WORD' })
  }
  if (!/^[\p{L}'-]+$/u.test(q) || q.length > 40) {
    return apiError('Word must be letters only and at most 40 characters.', { code: 'INVALID_WORD' })
  }

  const result = await partnerDictionary(q)
  if (!result) {
    return apiError(`No definition found for "${q}". Check the spelling and try again.`, {
      status: 404,
      code: 'WORD_NOT_FOUND',
    })
  }

  return apiResponse({
    operation: 'tools.dictionary',
    source: PARTNER_API_NAME,
    ...result,
  }, { cacheControl: 'public, max-age=86400, s-maxage=604800' })
}

export async function OPTIONS() {
  return optionsResponse()
}
