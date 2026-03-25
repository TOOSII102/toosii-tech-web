import { NextResponse } from 'next/server'
  import { cookies } from 'next/headers'
  import { getStats } from '../../../../lib/analytics'

  export async function GET() {
    const cookieStore = await cookies()
    const token  = cookieStore.get('admin_token')?.value
    const secret = process.env.ADMIN_SECRET || 'toosii-admin'
    if (!token || token !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { totalRequests, requests, recentActivity, uptime } = getStats()

    // Build top pages sorted by hit count
    const topPages = Object.entries(requests)
      .filter(([k]) => !k.includes('/api/admin') && !k.includes('/_next'))
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }))

    // Build recent visitor feed
    const recent = recentActivity
      .filter(e => !e.path.startsWith('/api/admin') && !e.path.startsWith('/_next'))
      .slice(0, 20)
      .map(e => ({
        path:    e.path,
        method:  e.method,
        country: e.country || '—',
        city:    e.city    || '',
        ts:      e.ts,
      }))

    return NextResponse.json({ totalRequests, topPages, recent, uptime })
  }
  