import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { consumeResetToken } from '../../../../lib/tokens'
import {
  SESSION_COOKIE,
  createSessionToken,
  getAdminSecret,
  sessionCookieOptions,
} from '../../../../lib/adminAuth'

export async function POST(req) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: 'Reset token is required.' }, { status: 400 })
    }

    if (!getAdminSecret()) {
      return NextResponse.json(
        { error: 'Admin access is not configured on this deployment.' },
        { status: 503 },
      )
    }

    const email = consumeResetToken(token)
    if (!email) {
      return NextResponse.json(
        { error: 'This link has expired or is invalid. Please request a new one.' },
        { status: 400 },
      )
    }

    // Token is valid — issue a real signed session for the admin.
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, await createSessionToken(email), sessionCookieOptions())

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Reset password error:', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
