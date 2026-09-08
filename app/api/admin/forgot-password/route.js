import { NextResponse } from 'next/server'
import { createResetToken } from '../../../../lib/tokens'
import { sendPasswordResetEmail } from '../../../../lib/email'

const ADMIN_EMAIL = 'toosii042@gmail.com'

export async function POST(req) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    // Always respond success to prevent email enumeration
    if (email.toLowerCase() !== ADMIN_EMAIL) {
      return NextResponse.json({ success: true })
    }

    const smtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS
    if (!smtpConfigured) {
      return NextResponse.json({ error: 'Email service is not configured on the server yet.' }, { status: 500 })
    }

    const token     = createResetToken(ADMIN_EMAIL)
    const baseUrl   = process.env.NEXT_PUBLIC_SITE_URL || 'https://toosiitechdevelopertools.zone.id'
    const resetLink = `${baseUrl}/admin/reset-password?token=${token}`

    await sendPasswordResetEmail(ADMIN_EMAIL, resetLink)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Forgot password error:', err)
    return NextResponse.json({ error: 'Failed to send reset email. Check SMTP settings.' }, { status: 500 })
  }
}
