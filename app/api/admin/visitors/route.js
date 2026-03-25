import { NextResponse } from 'next/server'
  import { cookies }         from 'next/headers'
  import { getVisitorStats } from '../../../../lib/visitorStore'

  const VA = 'https://vercel.com/api/web/insights'

  async function vaFetch(path, token, projectId, teamId) {
    const now  = Date.now()
    const from = now - 7 * 24 * 60 * 60 * 1000

    const url = new URL(VA + path)
    url.searchParams.set('projectId',   projectId)
    url.searchParams.set('from',        String(from))
    url.searchParams.set('to',          String(now))
    url.searchParams.set('filter',      '{}')
    url.searchParams.set('granularity', 'day')
    if (teamId) url.searchParams.set('teamId', teamId)

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      next:    { revalidate: 120 },
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { error: `HTTP ${res.status}: ${text.slice(0, 200)}` }
    }
    return res.json()
  }

  export async function GET() {
    // ── Auth ───────────────────────────────────────────────────────────────────
    const cookieStore  = await cookies()
    const sessionToken = cookieStore.get('admin_token')?.value
    const secret       = process.env.ADMIN_SECRET || 'toosii-admin'
    if (!sessionToken || sessionToken !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── In-memory / custom tracker ─────────────────────────────────────────────
    const local = getVisitorStats()

    // ── Vercel Analytics ───────────────────────────────────────────────────────
    const token     = process.env.VERCEL_TOKEN
    const projectId = process.env.VERCEL_PROJECT_ID || ''
    const teamId    = process.env.VERCEL_TEAM_ID    || process.env.VERCEL_ORG_ID || ''

    let vercel = null

    if (token && projectId) {
      const [statsRes, pagesRes, countriesRes] = await Promise.allSettled([
        vaFetch('/stats',     token, projectId, teamId),
        vaFetch('/pages',     token, projectId, teamId),
        vaFetch('/countries', token, projectId, teamId),
      ])

      vercel = {
        enabled:   true,
        stats:     statsRes.status     === 'fulfilled' ? statsRes.value     : null,
        pages:     pagesRes.status     === 'fulfilled' ? pagesRes.value     : null,
        countries: countriesRes.status === 'fulfilled' ? countriesRes.value : null,
        debug: {
          projectId,
          hasTeamId: !!teamId,
          statsErr:     statsRes.status     === 'rejected' ? statsRes.reason?.message     : (statsRes.value?.error     || null),
          pagesErr:     pagesRes.status     === 'rejected' ? pagesRes.reason?.message     : (pagesRes.value?.error     || null),
          countriesErr: countriesRes.status === 'rejected' ? countriesRes.reason?.message : (countriesRes.value?.error || null),
        },
      }
    } else {
      vercel = {
        enabled:  false,
        missing:  !token ? 'VERCEL_TOKEN' : 'VERCEL_PROJECT_ID',
      }
    }

    return NextResponse.json({ ...local, vercel })
  }
  