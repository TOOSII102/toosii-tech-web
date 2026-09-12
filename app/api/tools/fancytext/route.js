import { apiError, apiResponse, optionsResponse } from '../../../../lib/publicApi'
import { partnerFancyText, PARTNER_API_NAME } from '../../../../lib/partnerApi'

export async function GET(request) {
  const searchParams = new URL(request.url).searchParams
  const q = (searchParams.get('q') || '').trim()
  const style = searchParams.get('style')?.trim() || ''

  if (!q) {
    return apiError('Pass the text to restyle in ?q=.', { code: 'MISSING_TEXT' })
  }
  if (q.length > 60) {
    return apiError('Keep the text under 60 characters for best results.', { code: 'TEXT_TOO_LONG' })
  }

  const result = await partnerFancyText(q, style || 'random')
  if (!result) {
    return apiError('Fancy text is unavailable right now. Try again shortly.', {
      status: 502,
      code: 'FANCYTEXT_UNAVAILABLE',
    })
  }

  return apiResponse({
    operation: 'tools.fancytext',
    source: PARTNER_API_NAME,
    ...result,
  }, { cacheControl: 'public, max-age=3600, s-maxage=86400' })
}

export async function OPTIONS() {
  return optionsResponse()
}
