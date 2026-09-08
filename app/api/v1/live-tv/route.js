import { apiError, apiResponse, optionsResponse } from '../../../../lib/publicApi'
import { getIptvIndex, queryChannels } from '../../../../lib/iptv'
import { keepWorking } from '../../../../lib/streamHealth'

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
          languages: index.languages,
          regions: index.regions,
          blockedChannels: index.blockedCount,
        },
        { cacheControl: 'public, max-age=3600, stale-while-revalidate=86400' },
      )
    }

    // Over-fetch when verifying: a large share of catalogue streams are dead,
    // so we need spare candidates to still fill a page after filtering.
    const verify = searchParams.get('verify') !== '0'
    const wanted = Math.min(Math.max(parseInt(searchParams.get('limit')) || 48, 1), 100)

    const { channels, pagination } = queryChannels(index, {
      q: searchParams.get('q') || '',
      country: searchParams.get('country') || '',
      category: searchParams.get('category') || '',
      language: searchParams.get('language') || '',
      region: searchParams.get('region') || '',
      // Insecure (http://) streams are excluded by default: the site is served
      // over HTTPS, so browsers block them as mixed content.
      secureOnly: searchParams.get('includeInsecure') !== '1',
      page: searchParams.get('page') || 1,
      limit: verify ? Math.min(wanted * 3, 300) : wanted,
    })

    let list = channels
    let checked = 0
    if (verify) {
      checked = list.length
      list = (await keepWorking(list)).slice(0, wanted)
    }

    return apiResponse(
      {
        operation: 'live-tv.search',
        source: 'iptv-org',
        attribution: 'Channel data from the iptv-org public API (https://iptv-org.github.io)',
        query: {
          q: searchParams.get('q') || null,
          country: searchParams.get('country') || null,
          category: searchParams.get('category') || null,
          language: searchParams.get('language') || null,
          region: searchParams.get('region') || null,
        },
        pagination: verify
          ? { ...pagination, perPage: wanted, pages: Math.max(Math.ceil(pagination.total / wanted), 1), page: Math.min(pagination.page, Math.max(Math.ceil(pagination.total / wanted), 1)) }
          : pagination,
        verified: verify,
        checked,
        live: list.length,
        channels: list,
      },
      { cacheControl: verify ? 'public, max-age=120, stale-while-revalidate=600' : 'public, max-age=600, stale-while-revalidate=3600' },
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
