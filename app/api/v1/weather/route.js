import { apiError, apiResponse, optionsResponse } from '../../../../lib/publicApi'

const WEATHER_CODES = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
}

function readCoordinate(value, label, fallback) {
  if (value === null) return { value: fallback }
  if (!/^-?\d+(\.\d+)?$/.test(value)) return { error: `${label} must be a valid decimal coordinate.` }

  const parsed = Number(value)
  const min = label === 'latitude' ? -90 : -180
  const max = label === 'latitude' ? 90 : 180

  if (parsed < min || parsed > max) return { error: `${label} must be between ${min} and ${max}.` }
  return { value: parsed }
}

export async function GET(request) {
  const searchParams = new URL(request.url).searchParams
  const latitude = readCoordinate(searchParams.get('latitude'), 'latitude', -1.2864)
  const longitude = readCoordinate(searchParams.get('longitude'), 'longitude', 36.8172)

  if (latitude.error || longitude.error) {
    return apiError(latitude.error || longitude.error, { code: 'INVALID_COORDINATES' })
  }

  const upstream = new URL('https://api.open-meteo.com/v1/forecast')
  upstream.search = new URLSearchParams({
    latitude: String(latitude.value),
    longitude: String(longitude.value),
    current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max',
    forecast_days: '3',
    timezone: 'auto',
  }).toString()

  try {
    const response = await fetch(upstream, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      return apiError('The weather source is temporarily unavailable.', {
        status: 502,
        code: 'UPSTREAM_UNAVAILABLE',
      })
    }

    const data = await response.json()
    const days = data.daily?.time || []
    const forecast = days.map((date, index) => ({
      date,
      conditionCode: data.daily.weather_code?.[index] ?? null,
      condition: WEATHER_CODES[data.daily.weather_code?.[index]] || 'Unknown',
      temperatureMax: data.daily.temperature_2m_max?.[index] ?? null,
      temperatureMin: data.daily.temperature_2m_min?.[index] ?? null,
      precipitationProbabilityMax: data.daily.precipitation_probability_max?.[index] ?? null,
    }))

    return apiResponse({
      operation: 'weather.forecast',
      source: 'Open-Meteo',
      location: {
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
      },
      current: {
        time: data.current?.time || null,
        temperature: data.current?.temperature_2m ?? null,
        apparentTemperature: data.current?.apparent_temperature ?? null,
        windSpeed: data.current?.wind_speed_10m ?? null,
        conditionCode: data.current?.weather_code ?? null,
        condition: WEATHER_CODES[data.current?.weather_code] || 'Unknown',
      },
      units: data.current_units || {},
      forecast,
    }, { cacheControl: 'public, max-age=300, s-maxage=900' })
  } catch {
    return apiError('The weather source did not respond in time.', {
      status: 504,
      code: 'UPSTREAM_TIMEOUT',
    })
  }
}

export async function OPTIONS() {
  return optionsResponse()
}
