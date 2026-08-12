import { apiError, apiResponse, optionsResponse, readTextParam } from '../../../../../../lib/publicApi'

function isValidBase64(value) {
  const normalized = value.replace(/\s/g, '')
  return normalized.length > 0 && normalized.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(normalized)
}

export async function GET(request) {
  const result = readTextParam(request, 'text', 7000)
  if (result.error) return apiError(result.error)

  const input = result.value.replace(/\s/g, '')
  if (!isValidBase64(input)) {
    return apiError('The supplied text is not a valid Base64 value.', {
      code: 'INVALID_BASE64',
    })
  }

  try {
    const output = Buffer.from(input, 'base64').toString('utf8')
    return apiResponse({
      operation: 'base64.decode',
      input,
      output,
    }, { cacheControl: 'no-store' })
  } catch {
    return apiError('The supplied text could not be decoded as UTF-8 Base64.', {
      code: 'DECODE_FAILED',
    })
  }
}

export async function OPTIONS() {
  return optionsResponse()
}
