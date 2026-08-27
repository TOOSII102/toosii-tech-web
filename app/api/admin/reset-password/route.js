import { NextResponse } from 'next/server'
  import { cookies } from 'next/headers'
  import { consumeResetToken } from '../../../../lib/tokens'

  export async function POST(req) {
    try {
      const { token } = await req.json()

      if (!token) {
        return NextResponse.json({ error: 'Reset token is required.' }, { status: 400 })
      }

      const email = consumeResetToken(token)
      if (!email) {
        return NextResponse.json({ error: 'This link has expired or is invalid. Please request a new one.' }, { status: 400 })
      }

      // Token is valid — log the admin in
      const secret      = process.env.ADMIN_SECRET || 'toosii-admin'
      const cookieStore = await cookies()
      cookieStore.set('admin_token', secret, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge:   60 * 60 * 24 * 7, // 7 days
        path:     '/',
      })

      return NextResponse.json({ success: true })
    } catch (err) {
      console.error('Reset password error:', err)
      return NextResponse.json({ error: 'Server error.' }, { status: 500 })
    }
  }
  