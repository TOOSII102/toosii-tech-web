import { apiError, apiResponse, optionsResponse } from '../../../../lib/publicApi'

function getYear(value) {
  const fallback = new Date().getUTCFullYear()
  if (!value) return { value: fallback }
  if (!/^\d{4}$/.test(value)) return { error: 'year must be a four-digit calendar year.' }

  const year = Number(value)
  if (year < 1900 || year > 2100) return { error: 'year must be between 1900 and 2100.' }
  return { value: year }
}

export async function GET(request) {
  const searchParams = new URL(request.url).searchParams
  const country = (searchParams.get('country') || 'KE').trim().toUpperCase()
  const year = getYear(searchParams.get('year'))

  if (!/^[A-Z]{2}$/.test(country)) {
    return apiError('country must be a two-letter ISO 3166-1 alpha-2 code, such as KE or US.', {
      code: 'INVALID_COUNTRY_CODE',
    })
  }

  if (year.error) return apiError(year.error, { code: 'INVALID_YEAR' })

  try {
    const response = await fetch(`https://nagerholidays.com/api/v4/Holidays/${country}/${year.value}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    })

    if (response.status === 404) {
      return apiError('No holiday information is available for this country and year.', {
        status: 404,
        code: 'HOLIDAYS_NOT_FOUND',
      })
    }

    if (!response.ok) {
      return apiError('The holiday source is temporarily unavailable.', {
        status: 502,
        code: 'UPSTREAM_UNAVAILABLE',
      })
    }

    const data = await response.json()
    const holidays = Array.isArray(data) ? data.map(holiday => ({
      date: holiday.date,
      name: holiday.name,
      localName: holiday.localName || holiday.name,
      countryCode: holiday.countryCode,
      nationalHoliday: Boolean(holiday.nationalHoliday),
      types: holiday.types || holiday.holidayTypes || [],
    })) : []

    return apiResponse({
      operation: 'holidays.list',
      source: 'Nager.Date',
      country,
      year: year.value,
      count: holidays.length,
      holidays,
    }, { cacheControl: 'public, max-age=3600, s-maxage=86400' })
  } catch {
    return apiError('The holiday source did not respond in time.', {
      status: 504,
      code: 'UPSTREAM_TIMEOUT',
    })
  }
}

export async function OPTIONS() {
  return optionsResponse()
}
