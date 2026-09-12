import { NextResponse } from 'next/server'
import { partnerTempEmail } from '../../../../lib/partnerApi'

const EP = 'https://eliteprotech-apis.zone.id'

/* Fallback: reliable domains with known public inboxes */
const FALLBACK_DOMAINS = [
  'yopmail.com',
  'guerrillamail.com',
  'maildrop.cc',
  'mailinator.com',
  'sharklasers.com',
]

function randomString(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function generateFallback() {
  const user   = randomString(9)
  const domain = FALLBACK_DOMAINS[Math.floor(Math.random() * FALLBACK_DOMAINS.length)]
  return `${user}@${domain}`
}

async function fetchOne() {
  const res = await fetch(`${EP}/tempemail`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(10000),
  })
  const data = await res.json()
  if (!data.success || !data.email) throw new Error('No email returned')
  return data.email
}

export async function GET(request) {
  const count = Math.min(parseInt(new URL(request.url).searchParams.get('count') || '1', 10), 5)

  /* Try primary API */
  try {
    const results = await Promise.allSettled(Array.from({ length: count }, () => fetchOne()))
    const emails = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)
      .filter((e, i, a) => a.indexOf(e) === i)

    if (emails.length > 0) {
      return NextResponse.json({ email: emails[0], emails })
    }
  } catch {
    /* fall through to fallback */
  }

  /* Fallback: Partner API temporary mail */
  try {
    const fallbackEmails = []
    const partner = await partnerTempEmail()
    if (partner) fallbackEmails.push(partner)
    if (fallbackEmails.length > 0) {
      return NextResponse.json({ email: fallbackEmails[0], emails: fallbackEmails, fallback: true })
    }
  } catch {
    /* fall through to local generation */
  }

  /* Fallback: generate locally from known reliable domains */
  const fallback = []
  const seen = new Set()
  while (fallback.length < count) {
    const e = generateFallback()
    if (!seen.has(e)) { seen.add(e); fallback.push(e) }
  }
  return NextResponse.json({ email: fallback[0], emails: fallback, fallback: true })
}
