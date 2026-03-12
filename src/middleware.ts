import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const isLoginPage = request.nextUrl.pathname === '/login'

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (token && isLoginPage) {
    const kd_poli = request.cookies.get('kd_poli')?.value
    if (kd_poli === 'IGDK') {
      return NextResponse.redirect(new URL('/igd', request.url))
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (token && request.nextUrl.pathname === '/') {
    const kd_poli = request.cookies.get('kd_poli')?.value
    if (kd_poli === 'IGDK') {
      return NextResponse.redirect(new URL('/igd', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
