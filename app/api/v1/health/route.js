import { apiResponse, optionsResponse } from '../../../../lib/publicApi'

export async function GET() {
  return apiResponse({
    status: 'operational',
    service: 'public-api',
    uptime: 'available',
    documentation: '/api',
  }, { cacheControl: 'no-store' })
}

export async function OPTIONS() {
  return optionsResponse()
}
