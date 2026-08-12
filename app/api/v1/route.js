import { apiResponse, optionsResponse } from '../../../lib/publicApi'

const endpoints = [
  {
    method: 'GET',
    path: '/api/v1/health',
    category: 'Core',
    description: 'Check the service status and current API version.',
  },
  {
    method: 'GET',
    path: '/api/v1/utils/base64/encode?text=Hello',
    category: 'Utilities',
    description: 'Encode plain text as Base64.',
  },
  {
    method: 'GET',
    path: '/api/v1/utils/base64/decode?text=SGVsbG8%3D',
    category: 'Utilities',
    description: 'Decode a Base64 value into UTF-8 text.',
  },
  {
    method: 'GET',
    path: '/api/v1/utils/qr?text=https%3A%2F%2Ftoosiitech.com&size=320',
    category: 'Utilities',
    description: 'Generate a QR code as a PNG data URL.',
  },
  {
    method: 'GET',
    path: '/api/v1/sports?league=eng.1',
    category: 'Sports',
    description: 'Get a normalized live scoreboard for a supported league.',
  },
]

export async function GET() {
  return apiResponse({
    message: 'Welcome to Toosii API.',
    documentation: '/api',
    endpointCount: endpoints.length,
    endpoints,
  }, { cacheControl: 'public, max-age=60, s-maxage=60' })
}

export async function OPTIONS() {
  return optionsResponse()
}
