import { NextResponse } from 'next/server'
import { SESSION_COOKIE, getAdminSecret, verifySessionToken } from './lib/adminAuth'

const PUBLIC_ADMIN_PATHS = [
  '/admin/login',
  '/admin/forgot-password',
  '/admin/reset-password',
]

export async function middleware(request) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Public admin pages don't require a session
  if (PUBLIC_ADMIN_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Fail closed: with no (or a too-weak) ADMIN_SECRET there is no way to mint a
  // valid session, so the admin area stays locked rather than falling back to a
  // publicly-known default value.
  if (!getAdminSecret()) {
    const url = new URL('/admin/login', request.url)
    url.searchParams.set('error', 'not-configured')
    return NextResponse.redirect(url)
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value
  const email = await verifySessionToken(token)

  if (!email) {
    const response = NextResponse.redirect(new URL('/admin/login', request.url))
    // Clear an invalid/expired cookie so the browser stops re-sending it.
    if (token) response.cookies.delete(SESSION_COOKIE)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
