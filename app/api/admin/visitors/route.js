import { NextResponse } from 'next/server'
import { cookies }         from 'next/headers'
import { getVisitorStats } from '../../../../lib/visitorStore'
import { isValidAdminSession } from '../../../../lib/adminAuth'

const VA = 'https://vercel.com/api/web/insights'

async function vaFetch(path, token, projectId, teamId) {
  const now  = Date.now()
  const from = now - 7 * 24 * 60 * 60 * 1000
  const url  = new URL(VA + path)
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
    } catch {}
    return { error: errMsg, errorCode: errCode }
  }
  return res.json()
}

// Verify the token can access this project at all
async function verifyProject(token, projectId, teamId) {
  const url = new URL(`https://vercel.com/api/v9/projects/${projectId}`)
  if (teamId) url.searchParams.set('teamId', teamId)
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    return { ok: false, code: j?.error?.code || 'http_' + res.status, status: res.status }
  }
  const j = await res.json()
  return { ok: true, name: j.name, accountId: j.accountId }
}

export async function GET() {
  const cookieStore  = await cookies()
  const sessionToken = cookieStore.get('admin_token')?.value
  if (!isValidAdminSession(sessionToken)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const local     = getVisitorStats()
  const vaToken   = process.env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID || process.env.NEXT_PUBLIC_VERCEL_PROJECT_ID || ''
  const teamId    = process.env.VERCEL_TEAM_ID || process.env.VERCEL_ORG_ID || ''

  let vercel = null

  if (vaToken && projectId) {
    // First verify the token can actually access the project
    const check = await verifyProject(vaToken, projectId, teamId)

    if (!check.ok) {
      // Token doesn't have access to this project
      vercel = {
        enabled: true,
        stats:   null, pages: null, countries: null,
        debug: {
          projectId, hasTeamId: !!teamId,
          statsErr:     `Token cannot access project: ${check.code} (status ${check.status})`,
          pagesErr:     null,
          statsErrCode: check.code,
          notEnabled:   check.code === 'not_found',
          tokenMismatch: check.code === 'forbidden' || check.status === 403,
        },
      }
    } else {
      // Token works — now fetch analytics
      const [statsRes, pagesRes, countriesRes] = await Promise.allSettled([
        vaFetch('/stats',     vaToken, projectId, teamId),
        vaFetch('/pages',     vaToken, projectId, teamId),
        vaFetch('/countries', vaToken, projectId, teamId),
      ])
      const statsVal     = statsRes.status === 'fulfilled' ? statsRes.value : null
      const pagesVal     = pagesRes.status === 'fulfilled' ? pagesRes.value : null
      const countriesVal = countriesRes.status === 'fulfilled' ? countriesRes.value : null
      const statsErr     = statsVal?.error || (statsRes.status === 'rejected' ? statsRes.reason?.message : null)
      const pagesErr     = pagesVal?.error || (pagesRes.status === 'rejected' ? pagesRes.reason?.message : null)
      const statsErrCode = statsVal?.errorCode || null
      vercel = {
        enabled: true,
        stats: statsVal, pages: pagesVal, countries: countriesVal,
        debug: {
          projectId, hasTeamId: !!teamId,
          projectName:  check.name,
          statsErr, pagesErr, statsErrCode,
          notEnabled:    statsErrCode === 'not_found',
          tokenMismatch: false,
        },
      }
    }
  } else {
    vercel = {
      enabled: false,
      missing: !vaToken ? 'VERCEL_TOKEN' : 'VERCEL_PROJECT_ID',
    }
  }

  return NextResponse.json({ ...local, vercel })
}
