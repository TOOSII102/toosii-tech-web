import { NextResponse } from 'next/server'
  import { cookies }       from 'next/headers'
  import { getStats }      from '../../../../lib/analytics'

  const VA_BASE = 'https://vercel.com/api/web/insights'

  async function vaFetch(path, token, projectId, teamId) {
    const url = new URL(VA_BASE + path)
    url.searchParams.set('projectId', projectId)
    if (teamId) url.searchParams.set('teamId', teamId)

    // Default: last 7 days
    const now  = Date.now()
    const from = now - 7 * 24 * 60 * 60 * 1000
    url.searchParams.set('from',        String(from))
    url.searchParams.set('to',          String(now))
    url.searchParams.set('filter',      '{}')
    url.searchParams.set('granularity', 'day')

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 },
    })

    if (!res.ok) return null
    return res.json()
  }

  export async function GET() {
    // ── Auth ─────────────────────────────────────────────────────
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('admin_token')?.value
    const secret       = process.env.ADMIN_SECRET || 'toosii-admin'
    if (!sessionToken || sessionToken !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── In-memory session stats ───────────────────────────────────
    const { totalRequests, requests, recentActivity, uptime } = getStats()

    const topPages = Object.entries(requests)
      .filter(([k]) => !k.includes('/api/admin') && !k.includes('/_next'))
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }))

    const recent = recentActivity
      .filter(e => !e.path.startsWith('/api/admin') && !e.path.startsWith('/_next'))
      .slice(0, 20)
      .map(e => ({ path: e.path, method: e.method, country: e.country || '', city: e.city || '', ts: e.ts }))

    // ── Vercel Analytics (persistent) ────────────────────────────
    const vaToken     = process.env.VERCEL_TOKEN
    const vaProjectId = process.env.VERCEL_PROJECT_ID || ''
    const vaTeamId    = process.env.VERCEL_TEAM_ID    || ''

    let vercel = null

    if (vaToken && vaProjectId) {
      try {
        const [statsRes, pagesRes, countriesRes] = await Promise.all([
          vaFetch('/stats',     vaToken, vaProjectId, vaTeamId),
          vaFetch('/pages',     vaToken, vaProjectId, vaTeamId),
          vaFetch('/countries', vaToken, vaProjectId, vaTeamId),
        ])

        vercel = {
          stats:     statsRes,
          topPages:  pagesRes,
          countries: countriesRes,
          enabled:   true,
        }
      } catch {
        vercel = { enabled: false, error: 'Failed to fetch Vercel Analytics' }
      }
    } else {
      vercel = { enabled: false, error: !vaToken ? 'VERCEL_TOKEN not set' : 'VERCEL_PROJECT_ID not set' }
    }

    return NextResponse.json({ totalRequests, topPages, recent, uptime, vercel })
  }
  