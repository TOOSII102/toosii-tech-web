import { NextResponse } from 'next/server'
  import { cookies } from 'next/headers'

  export async function POST(req) {
    try {
      const { email, password } = await req.json()

      const adminEmail  = process.env.ADMIN_EMAIL
      const adminPass   = process.env.ADMIN_PASSWORD
      const secret      = process.env.ADMIN_SECRET || 'toosii-admin'

      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
      }

      const emailMatch = adminEmail ? email.toLowerCase() === adminEmail.toLowerCase() : true
      const passMatch  = adminPass  ? password === adminPass : password === secret

      if (!emailMatch || !passMatch) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
      }

      const cookieStore = await cookies()
      cookieStore.set('admin_token', secret, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge:   60 * 60 * 24 * 7, // 7 days
        path:     '/',
      })

      return NextResponse.json({ success: true })
    } catch {
      return NextResponse.json({ error: 'Server error.' }, { status: 500 })
    }
  }
  