import { NextResponse } from 'next/server'

const PUBLIC_ADMIN_PATHS = [
  '/admin/login',
  '/admin/forgot-password',
  '/admin/reset-password',
]

export function middleware(request) {
  const { pathname } = request.nextUrl
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-toosii-path', pathname)

  const continueRequest = () => NextResponse.next({
    request: { headers: requestHeaders },
  })

  if (!pathname.startsWith('/admin')) {
    return continueRequest()
  }

  if (PUBLIC_ADMIN_PATHS.some(path => pathname.startsWith(path))) {
    return continueRequest()
  }

  const token = request.cookies.get('admin_token')?.value
  const secret = process.env.ADMIN_SECRET || 'toosii-admin'

  if (!token || token !== secret) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return continueRequest()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
