import QRCode from 'qrcode'
import { apiError, apiResponse, optionsResponse, readTextParam } from '../../../../../lib/publicApi'

export async function GET(request) {
  const result = readTextParam(request, 'text', 2000)
  if (result.error) return apiError(result.error)

  const rawSize = Number(new URL(request.url).searchParams.get('size') || 320)
  const size = Number.isInteger(rawSize) && rawSize >= 120 && rawSize <= 1000 ? rawSize : null

  if (!size) {
    return apiError("The 'size' query parameter must be a whole number between 120 and 1000.", {
      code: 'INVALID_SIZE',
    })
  }

  try {
    const image = await QRCode.toDataURL(result.value, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: size,
      color: {
        dark: '#101827',
        light: '#ffffff',
      },
    })

    return apiResponse({
      operation: 'qr.create',
      text: result.value,
      size,
      format: 'png',
      image,
    }, { cacheControl: 'no-store' })
  } catch {
    return apiError('QR generation failed. Please try a shorter value.', {
      status: 500,
      code: 'QR_GENERATION_FAILED',
    })
  }
}

export async function OPTIONS() {
  return optionsResponse()
}
