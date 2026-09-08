import { NextResponse } from 'next/server'

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
    const secret = process.env.ADMIN_SECRET || 'toosii-admin'

    if (!token || token !== secret) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    return NextResponse.next()
  }

  export const config = {
    matcher: ['/admin/:path*'],
  }
  