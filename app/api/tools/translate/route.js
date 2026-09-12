import { apiError, apiResponse, optionsResponse } from '../../../../lib/publicApi'
import { partnerTranslate, PARTNER_API_NAME } from '../../../../lib/partnerApi'

export async function GET(request) {
  const searchParams = new URL(request.url).searchParams
  const text = (searchParams.get('text') || '').trim()
  const to = (searchParams.get('to') || 'sw').trim().toLowerCase().slice(0, 8)

  if (!text) {
    return apiError('Pass the text to translate in ?text=.', { code: 'MISSING_TEXT' })
  }
  if (text.length > 5000) {
    return apiError('Text is too long — keep it under 5000 characters.', { code: 'TEXT_TOO_LONG' })
  }
  if (!/^[a-z]{2,3}([-_][a-z0-9]+)*$/i.test(to)) {
    return apiError('Pass a language code in ?to= (for example en, sw, fr, zh).', { code: 'INVALID_LANGUAGE' })
  }

  const result = await partnerTranslate(text, to)
  if (!result) {
    return apiError('Translation is unavailable right now. Try again shortly.', {
      status: 502,
      code: 'TRANSLATE_UNAVAILABLE',
    })
  }

  return apiResponse({
    operation: 'tools.translate',
    source: PARTNER_API_NAME,
    ...result,
  }, { cacheControl: 'public, max-age=3600, s-maxage=86400' })
}

export async function OPTIONS() {
  return optionsResponse()
}
