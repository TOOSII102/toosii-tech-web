import { apiError, apiResponse, optionsResponse, readTextParam } from '../../../../../../lib/publicApi'

export async function GET(request) {
  const result = readTextParam(request, 'text', 5000)
  if (result.error) return apiError(result.error)

  const encoded = Buffer.from(result.value, 'utf8').toString('base64')

  return apiResponse({
    operation: 'base64.encode',
    input: result.value,
    output: encoded,
  }, { cacheControl: 'no-store' })
}

export async function OPTIONS() {
  return optionsResponse()
}
