import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/', '/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // For protected routes, check for token in cookie or redirect to login
  // Note: Since we use localStorage for tokens (client-side),
  // middleware can only check for a marker cookie
  const hasSession = request.cookies.get('has_session');
  if (!hasSession && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
