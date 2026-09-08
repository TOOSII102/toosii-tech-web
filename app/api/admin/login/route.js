import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  SESSION_COOKIE,
  createSessionToken,
  getAdminSecret,
  safeEqual,
  sessionCookieOptions,
} from '../../../../lib/adminAuth'

const ADMIN_EMAIL = 'toosii042@gmail.com'

export async function POST(req) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const secret = getAdminSecret()
    const adminPass = process.env.ADMIN_PASSWORD

    // Fail closed when the deployment isn't configured. Previously this fell back
    // to a hardcoded secret ('toosii-admin'), which let anyone log in.
    if (!secret || !adminPass) {
      console.error('[admin/login] ADMIN_SECRET (>=16 chars) and ADMIN_PASSWORD must both be set.')
      return NextResponse.json(
        { error: 'Admin login is not configured on this deployment.' },
        { status: 503 },
      )
    }

    const emailMatch = safeEqual(String(email).trim().toLowerCase(), ADMIN_EMAIL)
    const passMatch = safeEqual(String(password), adminPass)

    if (!emailMatch || !passMatch) {
      // Generic message — don't reveal which field was wrong.
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, await createSessionToken(ADMIN_EMAIL), sessionCookieOptions())

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
