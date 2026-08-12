import { NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getLicensedVideoAsset, isTerritoryAllowed } from '../../../../lib/videoAssets'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SUPPORTED_RESOLUTIONS = new Set(['360', '480', '720', '1080'])
const MAX_URL_TTL_SECONDS = 60 * 60
const DEFAULT_URL_TTL_SECONDS = 15 * 60

let r2Client

function requiredEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Server configuration is missing ${name}.`)
  return value
}

function createR2Client() {
  if (r2Client) return r2Client

  const accountId = requiredEnv('R2_ACCOUNT_ID')
  const endpoint = process.env.R2_S3_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`
  if (!endpoint.startsWith('https://')) throw new Error('R2_S3_ENDPOINT must use HTTPS.')

  r2Client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: requiredEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requiredEnv('R2_SECRET_ACCESS_KEY'),
    },
  })
  return r2Client
}

function safeString(value, maxLength = 160) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

function safeInteger(value) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function safeFilename(title, resolution) {
  const name = safeString(title, 100)
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return `${name || 'video'}-${resolution}p.mp4`
}

function getCountryCode(request) {
  return (
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    process.env.DEFAULT_CONTENT_COUNTRY ||
    ''
  ).toUpperCase()
}

function hasDownloadEntitlement(_request, asset) {
  // Replace this with your authentication/subscription/rental lookup when accounts are added.
  // Until then, only assets explicitly marked publicDownload can receive a signed URL.
  return asset.publicDownload === true
}

function downloadError(message, status) {
  return NextResponse.json({ error: message }, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function POST(request) {
  let payload
  try {
    payload = await request.json()
  } catch {
    return downloadError('A JSON download request is required.', 400)
  }

  const subjectId = safeString(payload?.subjectId)
  const type = payload?.type === 'episode' ? 'episode' : 'movie'
  const resolution = safeString(String(payload?.resolution || '720'), 4)
  const season = type === 'episode' ? safeInteger(payload?.season) : null
  const episode = type === 'episode' ? safeInteger(payload?.episode) : null

  if (!subjectId) return downloadError('A movie or series identifier is required.', 400)
  if (!SUPPORTED_RESOLUTIONS.has(resolution)) return downloadError('Unsupported download resolution.', 400)
  if (type === 'episode' && (!season || !episode)) {
    return downloadError('Season and episode are required for an episode download.', 400)
  }

  // This registry/database lookup is intentionally separate from the public discovery catalogue.
  const asset = getLicensedVideoAsset({ subjectId, type, season, episode, resolution })
  if (!asset) {
    return downloadError('No authorized download is available for this title and quality.', 404)
  }

  const countryCode = getCountryCode(request)
  if (!isTerritoryAllowed(asset, countryCode)) {
    return downloadError('This title is not available for download in your location.', 451)
  }

  if (!hasDownloadEntitlement(request, asset)) {
    return downloadError('Sign in or purchase access before downloading this title.', 403)
  }

  try {
    const requestedTtl = Number.parseInt(process.env.DOWNLOAD_URL_TTL_SECONDS || '', 10)
    const expiresIn = Math.min(
      Number.isInteger(requestedTtl) && requestedTtl > 0 ? requestedTtl : DEFAULT_URL_TTL_SECONDS,
      MAX_URL_TTL_SECONDS,
    )
    const filename = safeFilename(asset.title, resolution)
    const command = new GetObjectCommand({
      Bucket: requiredEnv('R2_BUCKET'),
      Key: asset.r2Key,
      ResponseContentType: 'video/mp4',
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    })

    const url = await getSignedUrl(createR2Client(), command, { expiresIn })
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    // Add a database audit event here: subjectId, asset ID, user ID, country, timestamp, and expiry.
    return NextResponse.json({
      url,
      filename,
      expiresAt,
      resolution: Number(resolution),
    }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('Unable to create an R2 download URL:', error instanceof Error ? error.message : error)
    return downloadError('The download link could not be prepared. Please try again later.', 503)
  }
}

export async function GET() {
  return downloadError('Use POST to request a signed download URL.', 405)
}
