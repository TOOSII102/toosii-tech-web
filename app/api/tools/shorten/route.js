import { apiError, apiResponse, optionsResponse } from '../../../../lib/publicApi'
import { partnerShorten, PARTNER_API_NAME } from '../../../../lib/partnerApi'
import { hubShorten } from '../../../../lib/apiHub'

const SERVICES = ['tinyurl', 'vgd', 'random', 'dagd', 'bitly']

export async function GET(request) {
  const searchParams = new URL(request.url).searchParams
  const url = (searchParams.get('url') || '').trim()
  const service = (searchParams.get('service') || 'tinyurl').trim().toLowerCase()
  const alias = (searchParams.get('alias') || '').trim().slice(0, 40)

  if (!/^https?:\/\//i.test(url)) {
    return apiError('Pass a valid http(s) URL in ?url=.', { code: 'INVALID_URL' })
  }
  if (url.length > 2048) {
    return apiError('URL is too long.', { code: 'URL_TOO_LONG' })
  }
  if (!SERVICES.includes(service)) {
    return apiError('Unsupported shortener. Choose: ' + SERVICES.join(', '), {
      code: 'UNSUPPORTED_SERVICE',
      details: { services: SERVICES },
    })
  }

  let result = await partnerShorten(url, service, alias)
  if (!result) result = await hubShorten(url)
  if (!result) {
    return apiError('Shortening failed. Try a different service or check the URL.', {
      status: 502,
      code: 'SHORTENER_UNAVAILABLE',
    })
  }

  return apiResponse({
    operation: 'shortener.shorten',
    source: PARTNER_API_NAME,
    ...result,
  }, { cacheControl: 'public, max-age=3600, s-maxage=86400' })
}

export async function OPTIONS() {
  return optionsResponse()
}
