import { NextResponse } from 'next/server'
  import { cookies } from 'next/headers'
  import { getStats } from '../../../../lib/analytics'
  import { isValidAdminSession } from '../../../../lib/adminAuth'

  const OWNER = 'TOOSII102'
  const REPO  = 'toosii-tech-web'

  async function ghFetch(path) {
    const headers = { Accept: 'application/vnd.github+json' }
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
    }
    try {
      const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}${path}`, {
        headers,
        next: { revalidate: 300 },
      })
      return res.ok ? res.json() : null
    } catch {
      return null
    }
  }

  export async function GET() {
    // Auth check
    const cookieStore = await cookies()
    const token  = cookieStore.get('admin_token')?.value

    if (!isValidAdminSession(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [github, commits] = await Promise.all([
      ghFetch(''),
      ghFetch('/commits?per_page=8'),
    ])

    const analyticsStats = getStats()

    return NextResponse.json({
      github,
      commits: commits || [],
      server: {
        nodeVersion: process.version,
        platform:    process.platform,
        memoryMB:    Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        uptime:      Math.floor(process.uptime()),
        env:         process.env.NODE_ENV || 'development',
        totalRequests: analyticsStats.totalRequests,
      },
    })
  }
