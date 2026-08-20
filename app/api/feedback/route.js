import { NextResponse } from 'next/server'
import { sendFeedbackEmail } from '../../../lib/email'

export const runtime = 'nodejs'

function clean(value, limit) {
  return String(value || '').trim().slice(0, limit)
}

export async function POST(request) {
  try {
    const body = await request.json()
    if (clean(body.website, 120)) return NextResponse.json({ success: true, message: 'Thanks for your feedback.' })
    const category = clean(body.category, 80) || 'General feedback'
    const name = clean(body.name, 120) || 'Toosii Tech visitor'
    const email = clean(body.email, 200)
    const message = clean(body.message, 4000)
    if (message.length < 10) return NextResponse.json({ success: false, error: 'Please provide at least 10 characters of feedback.' }, { status: 400 })
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 })

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      const subject = encodeURIComponent(`[Toosii feedback] ${category}`)
      const content = encodeURIComponent(`Name: ${name}\nEmail: ${email || 'Not provided'}\nCategory: ${category}\n\n${message}`)
      return NextResponse.json({ success: false, fallbackUrl: `mailto:toosiitechcompany@gmail.com?subject=${subject}&body=${content}`, error: 'Email delivery is not configured on the server. Your email app can still send this message.' }, { status: 503 })
    }

    await sendFeedbackEmail({ category, name, email, message })
    return NextResponse.json({ success: true, message: 'Feedback sent successfully. Thank you.' })
  } catch (error) {
    console.error('[feedback]', error)
    return NextResponse.json({ success: false, error: 'Feedback could not be sent right now. Please try again or use direct email.' }, { status: 500 })
  }
}
