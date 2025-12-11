import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  const expectedToken = process.env.DASHBOARD_ADMIN_TOKEN;

  // Allow public access to API routes (they can have their own auth)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Check for token in header or cookie
  if (!token && !request.cookies.get('dashboard_token')) {
    // Redirect to login if no token
    if (request.nextUrl.pathname !== '/auth/login') {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // Verify token
  if (token && token !== expectedToken) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
