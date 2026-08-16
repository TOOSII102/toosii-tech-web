import { NextResponse } from 'next/server'

const SOURCE_URL = 'https://feeds.bbci.co.uk/news/world/africa/rss.xml'
const SOURCE_NAME = 'BBC News Africa RSS'

function decodeEntities(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/<[^>]+>/g, '')
    .trim()
}

function field(block, name) {
  const match = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, 'i'))
  return decodeEntities(match?.[1] || '')
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query = (searchParams.get('q') || '').trim().toLowerCase()
  const requestedLimit = Number.parseInt(searchParams.get('limit') || '10', 10)
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 20) : 10

  try {
    const response = await fetch(SOURCE_URL, {
      headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
      signal: AbortSignal.timeout(12000),
      next: { revalidate: 300 },
    })

    if (!response.ok) throw new Error(`News source returned ${response.status}`)
    const xml = await response.text()
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(match => match[1])

    const articles = items
      .map(item => ({
        title: field(item, 'title'),
        url: field(item, 'link'),
        description: field(item, 'description'),
        publishedAt: field(item, 'pubDate'),
      }))
      .filter(article => article.title && article.url)
      .filter(article => {
        if (!query) return true
        return `${article.title} ${article.description}`.toLowerCase().includes(query)
      })
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      api: 'Toosii API',
      source: SOURCE_NAME,
      sourceUrl: SOURCE_URL,
      query: query || null,
      count: articles.length,
      articles,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('[news]', error.message)
    return NextResponse.json({
      success: false,
      api: 'Toosii API',
      error: 'News service is temporarily unavailable. Try again shortly.',
    }, { status: 502 })
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
