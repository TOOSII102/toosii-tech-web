import { NextResponse } from 'next/server'
  import { isValidAdminSession } from './lib/adminAuth'

  const PUBLIC_ADMIN_PATHS = [
    '/admin/login',
    '/admin/forgot-password',
    '/admin/reset-password',
  ]

  export function middleware(request) {
    const { pathname } = request.nextUrl

    if (!pathname.startsWith('/admin')) {
      return NextResponse.next()
    }

    // Public admin pages don't require a session
    if (PUBLIC_ADMIN_PATHS.some(p => pathname.startsWith(p))) {
      return NextResponse.next()
    }

    const token  = request.cookies.get('admin_token')?.value

    if (!isValidAdminSession(token)) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    return NextResponse.next()
  }

  export const config = {
    matcher: ['/admin/:path*'],
  }
