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
    let errCode = 'http_' + res.status
    let errMsg  = 'HTTP ' + res.status
    try {
      const j = await res.json()
      errCode = j?.error?.code || errCode
      errMsg  = `HTTP ${res.status}: ${j?.error?.message || JSON.stringify(j).slice(0, 150)}`
    } catch { errMsg = 'HTTP ' + res.status }
    return { error: errMsg, errorCode: errCode }
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
  const vaToken   = process.env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID || process.env.NEXT_PUBLIC_VERCEL_PROJECT_ID || ''
  // VERCEL_ORG_ID is auto-injected by Vercel for team projects when system env vars are exposed
  const teamId    = process.env.VERCEL_TEAM_ID || process.env.VERCEL_ORG_ID || ''

  let vercel = null

  if (vaToken && projectId) {
    const [statsRes, pagesRes, countriesRes] = await Promise.allSettled([
      vaFetch('/stats',     vaToken, projectId, teamId),
      vaFetch('/pages',     vaToken, projectId, teamId),
      vaFetch('/countries', vaToken, projectId, teamId),
    ])

    const statsVal     = statsRes.status     === 'fulfilled' ? statsRes.value     : null
    const pagesVal     = pagesRes.status     === 'fulfilled' ? pagesRes.value     : null
    const countriesVal = countriesRes.status === 'fulfilled' ? countriesRes.value : null

    // Detect specific error codes
    const statsErr     = statsVal?.error     || (statsRes.status     === 'rejected' ? statsRes.reason?.message     : null)
    const pagesErr     = pagesVal?.error     || (pagesRes.status     === 'rejected' ? pagesRes.reason?.message     : null)
    const statsErrCode = statsVal?.errorCode || null

    vercel = {
      enabled:   true,
      stats:     statsVal,
      pages:     pagesVal,
      countries: countriesVal,
      debug: {
        projectId,
        hasTeamId:    !!teamId,
        statsErr,
        pagesErr,
        statsErrCode,                     // 'not_found' when Analytics not enabled
        notEnabled:   statsErrCode === 'not_found',
      },
    }
  } else {
    vercel = {
      enabled: false,
      missing: !vaToken ? 'VERCEL_TOKEN' : 'VERCEL_PROJECT_ID',
    }
  }

  return NextResponse.json({ ...local, vercel })
}
