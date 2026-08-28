import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookieName, verifyAdminSessionToken } from './lib/admin-session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminLoginRoute = pathname === '/admin/login';
  const isAuthenticated = await verifyAdminSessionToken(request.cookies.get(cookieName)?.value);

  if (isAdminRoute && !isAdminLoginRoute && !isAuthenticated) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminLoginRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
