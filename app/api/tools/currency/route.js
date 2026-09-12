import { apiError, apiResponse, optionsResponse } from '../../../../lib/publicApi'
import { partnerCurrencyConversion, PARTNER_API_NAME } from '../../../../lib/partnerApi'
import { hubCurrencyConversion } from '../../../../lib/apiHub'

export async function GET(request) {
  const searchParams = new URL(request.url).searchParams
  const from = (searchParams.get('from') || 'USD').trim()
  const to = (searchParams.get('to') || 'KES').trim()
  const rawAmount = searchParams.get('amount')
  const amount = rawAmount === null || rawAmount === '' ? 1 : Number(rawAmount)

  if (!/^[A-Za-z]{3}$/.test(from) || !/^[A-Za-z]{3}$/.test(to)) {
    return apiError('Use three-letter currency codes (for example USD, KES, EUR).', {
      code: 'INVALID_CURRENCY',
    })
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return apiError('amount must be a positive number.', { code: 'INVALID_AMOUNT' })
  }
  if (amount > 100_000_000) {
    return apiError('amount is too large.', { code: 'AMOUNT_TOO_LARGE' })
  }

  let result = await partnerCurrencyConversion(amount, from, to)
  if (!result) result = await hubCurrencyConversion(amount, from, to)
  if (!result) {
    return apiError('Exchange rates are unavailable right now. Try again shortly.', {
      status: 502,
      code: 'FX_UNAVAILABLE',
    })
  }

  return apiResponse({
    operation: 'tools.currency',
    source: PARTNER_API_NAME,
    ...result,
  }, { cacheControl: 'public, max-age=300, s-maxage=900' })
}

export async function OPTIONS() {
  return optionsResponse()
}
