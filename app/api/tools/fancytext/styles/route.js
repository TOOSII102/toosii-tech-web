import { apiError, apiResponse, optionsResponse } from '../../../../../lib/publicApi'
import { partnerFancyStyles, PARTNER_API_NAME } from '../../../../../lib/partnerApi'

export async function GET(request) {
  const q = (new URL(request.url).searchParams.get('q') || '').trim()

  if (!q) {
    return apiError('Pass the text to preview in ?q=.', { code: 'MISSING_TEXT' })
  }
  if (q.length > 60) {
    return apiError('Keep the text under 60 characters for best results.', { code: 'TEXT_TOO_LONG' })
  }

  const styles = await partnerFancyStyles(q)
  if (!styles) {
    return apiError('Fancy text styles are unavailable right now. Try again shortly.', {
      status: 502,
      code: 'FANCYTEXT_UNAVAILABLE',
    })
  }

  return apiResponse({
    operation: 'tools.fancytext.styles',
    source: PARTNER_API_NAME,
    count: styles.length,
    styles,
  }, { cacheControl: 'public, max-age=600, s-maxage=3600' })
}

export async function OPTIONS() {
  return optionsResponse()
}
