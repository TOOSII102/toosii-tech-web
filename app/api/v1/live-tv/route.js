import { apiError, apiResponse, optionsResponse } from '../../../../lib/publicApi'
import { getIptvIndex, queryChannels } from '../../../../lib/iptv'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { searchParams } = new URL(request.url)

  try {
    const index = await getIptvIndex()

    // ?facets=1 returns the country/category lists for the filter dropdowns.
    if (searchParams.get('facets')) {
      return apiResponse(
        {
          operation: 'live-tv.facets',
          source: 'iptv-org',
          total: index.totalSecure,
          countries: index.countries,
          categories: index.categories,
        },
        { cacheControl: 'public, max-age=3600, stale-while-revalidate=86400' },
      )
    }

    const { channels, pagination } = queryChannels(index, {
      q: searchParams.get('q') || '',
      country: searchParams.get('country') || '',
      category: searchParams.get('category') || '',
      // Insecure (http://) streams are excluded by default: the site is served
      // over HTTPS, so browsers block them as mixed content.
      secureOnly: searchParams.get('includeInsecure') !== '1',
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 48,
    })

    return apiResponse(
      {
        operation: 'live-tv.search',
        source: 'iptv-org',
        attribution: 'Channel data from the iptv-org public API (https://iptv-org.github.io)',
        query: {
          q: searchParams.get('q') || null,
          country: searchParams.get('country') || null,
          category: searchParams.get('category') || null,
        },
        pagination,
        channels,
      },
      { cacheControl: 'public, max-age=600, stale-while-revalidate=3600' },
    )
  } catch (err) {
    return apiError('The live TV catalogue is temporarily unavailable. Please try again shortly.', {
      status: 503,
      code: 'CATALOGUE_UNAVAILABLE',
      details: err?.message,
    })
  }
}

export async function OPTIONS() {
  return optionsResponse()
}
