import { NextResponse } from 'next/server'

export const API_NAME = 'Toosii API'
export const API_VERSION = 'v1'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Expose-Headers': 'X-API-Version',
  'X-API-Version': API_VERSION,
  'X-API-Provider': 'Toosii Tech',
}

export function apiResponse(payload, { status = 200, cacheControl = 'no-store' } = {}) {
  return NextResponse.json(
    {
      success: status >= 200 && status < 300,
      api: API_NAME,
      version: API_VERSION,
      timestamp: new Date().toISOString(),
      ...payload,
    },
    {
      status,
      headers: {
        ...corsHeaders,
        'Cache-Control': cacheControl,
      },
    },
  )
}

export function apiError(message, { status = 400, code = 'BAD_REQUEST', details } = {}) {
  return apiResponse(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status },
  )
}

export function optionsResponse() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

export function readTextParam(request, name = 'text', maxLength = 1000) {
  const value = new URL(request.url).searchParams.get(name)?.trim() || ''

  if (!value) {
    return { error: `The '${name}' query parameter is required.` }
  }

  if (value.length > maxLength) {
    return { error: `The '${name}' query parameter must be ${maxLength} characters or fewer.` }
  }

  return { value }
}
