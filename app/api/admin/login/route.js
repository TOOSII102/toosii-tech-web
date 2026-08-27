import { NextResponse } from 'next/server'
  import { cookies } from 'next/headers'
  import { ADMIN_EMAIL, getAdminCredentials } from '../../../../lib/adminAuth'

  export async function POST(req) {
    try {
      const { email, password } = await req.json()

      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
      }

      const credentials = getAdminCredentials()
      if (!credentials) {
        return NextResponse.json({ error: 'Admin authentication is not configured on the server.' }, { status: 503 })
      }

      const emailMatch = email.toLowerCase() === ADMIN_EMAIL
      const passMatch  = password === credentials.password

      if (!emailMatch || !passMatch) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
      }

      const cookieStore = await cookies()
      cookieStore.set('admin_token', credentials.secret, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge:   60 * 60 * 24 * 7,
        path:     '/',
      })

      return NextResponse.json({ success: true })
    } catch {
      return NextResponse.json({ error: 'Server error.' }, { status: 500 })
    }
  }
