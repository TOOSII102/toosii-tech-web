import { NextResponse } from 'next/server'
  import { createResetToken } from '../../../../lib/tokens'
  import { sendPasswordResetEmail } from '../../../../lib/email'

  export async function POST(req) {
    try {
      const { email } = await req.json()

      if (!email) {
        return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
      }

      const adminEmail = process.env.ADMIN_EMAIL
      if (!adminEmail) {
        return NextResponse.json({ error: 'Admin email is not configured on the server.' }, { status: 500 })
      }

      // Always respond with success to prevent email enumeration
      if (email.toLowerCase() !== adminEmail.toLowerCase()) {
        return NextResponse.json({ success: true })
      }

      const token     = createResetToken(email)
      const baseUrl   = process.env.NEXT_PUBLIC_SITE_URL || 'https://toosiitechdevelopertools.zone.id'
      const resetLink = `${baseUrl}/admin/reset-password?token=${token}`

      await sendPasswordResetEmail(adminEmail, resetLink)

      return NextResponse.json({ success: true })
    } catch (err) {
      console.error('Forgot password error:', err)
      return NextResponse.json({ error: 'Failed to send reset email. Check your SMTP settings.' }, { status: 500 })
    }
  }
  