// Server-route helper for admin authentication.
//
// Kept separate from lib/adminAuth.js because this imports `next/headers`, which
// is only available in the Node.js runtime — importing it into the Edge
// middleware bundle would break the build.

import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySessionToken } from './adminAuth'

/**
 * Returns the authenticated admin email, or null when the caller is not a valid,
 * unexpired, correctly-signed admin session.
 */
export async function getAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  return verifySessionToken(token)
}
