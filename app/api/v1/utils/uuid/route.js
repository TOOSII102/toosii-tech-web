import { randomUUID } from 'crypto'
import { apiError, apiResponse, optionsResponse } from '../../../../../lib/publicApi'

export async function GET(request) {
  const rawCount = new URL(request.url).searchParams.get('count') || '1'
  if (!/^\d+$/.test(rawCount)) {
    return apiError('count must be a whole number between 1 and 25.', { code: 'INVALID_COUNT' })
  }

  const count = Number(rawCount)
  if (count < 1 || count > 25) {
    return apiError('count must be a whole number between 1 and 25.', { code: 'INVALID_COUNT' })
  }

  const uuids = Array.from({ length: count }, () => randomUUID())

  return apiResponse({
    operation: 'uuid.generate',
    count,
    uuids,
  }, { cacheControl: 'no-store' })
}

export async function OPTIONS() {
  return optionsResponse()
}
