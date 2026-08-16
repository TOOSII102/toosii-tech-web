import { apiError, apiResponse, optionsResponse, readTextParam } from '../../../../../lib/publicApi'

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function GET(request) {
  const result = readTextParam(request, 'text', 500)
  if (result.error) return apiError(result.error)

  const slug = slugify(result.value)
  if (!slug) {
    return apiError('The supplied text does not contain characters that can form a URL slug.', {
      code: 'EMPTY_SLUG',
    })
  }

  return apiResponse({
    operation: 'slugify',
    input: result.value,
    slug,
  }, { cacheControl: 'no-store' })
}

export async function OPTIONS() {
  return optionsResponse()
}
