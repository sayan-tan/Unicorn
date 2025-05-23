import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('authToken')?.value;
  const isAuthPage = request.nextUrl.pathname === '/login';
  const isProtectedRoute = [
    '/homepage',
    '/github-insights',
    '/health-quality',
    '/security-threats',
    '/faq'
  ].some(path => request.nextUrl.pathname.startsWith(path));

  // If user is not authenticated and trying to access protected routes
  if (!authToken && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and trying to access login page
  if (authToken && isAuthPage) {
    return NextResponse.redirect(new URL('/homepage', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/homepage/:path*',
    '/github-insights/:path*',
    '/health-quality/:path*',
    '/security-threats/:path*',
    '/faq/:path*',
    '/login'
  ],
}; 