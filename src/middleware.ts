import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from './app/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for login page, API auth routes, and static files
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for authentication token
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    // Redirect to login page
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token
  const payload = await AuthService.verifyToken(token);
  
  if (!payload) {
    // Invalid token, redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth-token');
    return response;
  }

  // Add user info to headers for API routes
  const response = NextResponse.next();
  response.headers.set('x-user-id', payload.userId.toString());
  response.headers.set('x-username', payload.username);

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};