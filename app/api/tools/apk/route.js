import { NextResponse } from 'next/server'

const EP = 'https://eliteprotech-apis.zone.id'

export async function POST(req) {
  try {
    const { query } = await req.json()
    if (!query?.trim()) {
      return NextResponse.json({ error: 'Please enter an app name to search.' }, { status: 400 })
    }

    const res = await fetch(`${EP}/apk?q=${encodeURIComponent(query.trim())}`, {
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) throw new Error(`EliteProTech ${res.status}`)
    const data = await res.json()

    if (!data.status || !Array.isArray(data.results) || data.results.length === 0) {
      return NextResponse.json({ error: 'No APKs found for that search. Try a different name.' }, { status: 404 })
    }

    const apps = data.results.slice(0, 8).map(a => ({
      name:     a.name    || 'Unknown App',
      package:  a.package || '',
      version:  a.file?.vername || '',
      size:     a.file?.filesize || '',
      download: a.file?.path || '',
      icon:     a.icon   || '',
    }))

    return NextResponse.json({ apps })
  } catch (e) {
    console.error('[apk]', e.message)
    return NextResponse.json({ error: 'Search failed. Try again later.' }, { status: 500 })
  }
}
