import { NextResponse } from 'next/server'
  import { cookies } from 'next/headers'

  export async function POST(req) {
    try {
      const { password } = await req.json()
      const secret = process.env.ADMIN_SECRET || 'toosii-admin'

      if (!password || password !== secret) {
        return NextResponse.json({ error: 'Invalid password.' }, { status: 401 })
      }

      const cookieStore = await cookies()
      cookieStore.set('admin_token', secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })

      return NextResponse.json({ success: true })
    } catch {
      return NextResponse.json({ error: 'Server error.' }, { status: 500 })
    }
  }
  