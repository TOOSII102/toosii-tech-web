import { NextResponse } from 'next/server'
import { partnerApk } from '../../../../lib/partnerApi'

const EP = 'https://eliteprotech-apis.zone.id'

export async function POST(req) {
  let query
  try {
    query = (await req.json())?.query?.trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  if (!query) {
    return NextResponse.json({ error: 'Please enter an app name to search.' }, { status: 400 })
  }

  let primaryFailed = false
  try {
    const res = await fetch(`${EP}/apk?q=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(20000),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.status && Array.isArray(data.results) && data.results.length > 0) {
        const apps = data.results.slice(0, 8).map(a => ({
          name:     a.name    || 'Unknown App',
          package:  a.package || '',
          version:  a.file?.vername || '',
          size:     a.file?.filesize || '',
          download: a.file?.path || '',
          icon:     a.icon   || '',
        }))

        return NextResponse.json({ apps })
      }
    } else {
      primaryFailed = true
    }
  } catch (e) {
    console.error('[apk:primary]', e.message)
    primaryFailed = true
  }

  // Fallback: Partner API APK search (apk4all mirror).
  try {
    const apps = await partnerApk(query)
    if (apps?.length) {
      return NextResponse.json({ apps: apps.slice(0, 8), fallback: true })
    }
  } catch (fallbackError) {
    console.error('[apk:fallback]', fallbackError.message)
  }

  if (primaryFailed) {
    return NextResponse.json({ error: 'Search failed. Try again later.' }, { status: 500 })
  }
  return NextResponse.json({ error: 'No APKs found for that search. Try a different name.' }, { status: 404 })
}
