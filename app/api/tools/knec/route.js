import { apiError, apiResponse, optionsResponse } from '../../../../lib/publicApi'
import { partnerKnec, PARTNER_API_NAME } from '../../../../lib/partnerApi'

export async function GET(request) {
  const searchParams = new URL(request.url).searchParams
  const indexNumber = (searchParams.get('index') || '').trim()
  const name = (searchParams.get('name') || '').trim()

  if (!/^\d{7,12}$/.test(indexNumber)) {
    return apiError('Pass a valid KCSE index number in ?index= (7 to 12 digits).', {
      code: 'INVALID_INDEX',
    })
  }
  if (!name || name.length < 3) {
    return apiError('Pass the candidate full name in ?name= — it must match the KNEC records.', {
      code: 'MISSING_NAME',
    })
  }
  if (name.length > 80) {
    return apiError('Name is too long.', { code: 'NAME_TOO_LONG' })
  }

  const result = await partnerKnec(indexNumber, name)
  if (!result) {
    return apiError('KCSE result check is unavailable right now — the KNEC feed may be busy. Try again in a few minutes.', {
      status: 502,
      code: 'KNEC_UNAVAILABLE',
    })
  }

  return apiResponse({
    operation: 'education.kcse',
    source: PARTNER_API_NAME,
    ...result,
    notice: 'Result data is provided as returned by the KNEC feed. Always verify important records on the official KNEC portal.',
  }, { cacheControl: 'public, max-age=300, s-maxage=3600' })
}

export async function OPTIONS() {
  return optionsResponse()
}
