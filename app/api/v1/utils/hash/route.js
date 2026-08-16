import { createHash } from 'crypto'
import { apiError, apiResponse, optionsResponse, readTextParam } from '../../../../../lib/publicApi'

const ALGORITHMS = new Set(['sha256', 'sha384', 'sha512'])

export async function GET(request) {
  const result = readTextParam(request, 'text', 10000)
  if (result.error) return apiError(result.error)

  const algorithm = (new URL(request.url).searchParams.get('algorithm') || 'sha256').toLowerCase()
  if (!ALGORITHMS.has(algorithm)) {
    return apiError('algorithm must be sha256, sha384, or sha512.', {
      code: 'UNSUPPORTED_ALGORITHM',
      details: { supportedAlgorithms: [...ALGORITHMS] },
    })
  }

  const hash = createHash(algorithm).update(result.value, 'utf8').digest('hex')

  return apiResponse({
    operation: 'hash.text',
    algorithm,
    inputLength: result.value.length,
    hash,
  }, { cacheControl: 'no-store' })
}

export async function OPTIONS() {
  return optionsResponse()
}
