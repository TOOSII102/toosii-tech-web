import { NextResponse } from 'next/server'
  import { cookies }         from 'next/headers'
  import { getVisitorStats } from '../../../../lib/visitorStore'

  export async function GET() {
    const cookieStore  = await cookies()
    const sessionToken = cookieStore.get('admin_token')?.value
    const secret       = process.env.ADMIN_SECRET || 'toosii-admin'
    if (!sessionToken || sessionToken !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const stats = getVisitorStats()
    return NextResponse.json(stats)
  }
  