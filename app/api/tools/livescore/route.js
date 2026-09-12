import { apiError, apiResponse, optionsResponse } from '../../../../lib/publicApi'
import { partnerLiveScores, PARTNER_API_NAME } from '../../../../lib/partnerApi'

export async function GET() {
  const result = await partnerLiveScores()
  if (!result) {
    return apiError('Live scores are unavailable right now. Try again shortly.', {
      status: 502,
      code: 'LIVESCORE_UNAVAILABLE',
    })
  }

  return apiResponse({
    operation: 'sports.livescore',
    source: PARTNER_API_NAME,
    ...result,
  }, { cacheControl: 'public, max-age=20, s-maxage=20' })
}

export async function OPTIONS() {
  return optionsResponse()
}
