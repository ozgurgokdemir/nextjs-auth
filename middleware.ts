import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateSession } from '@/lib/auth/session';
import { ratelimit } from '@/lib/ratelimit';
import { getClientIP } from '@/lib/ip';

const ROUTES = {
  protected: ['/dashboard'],
  authentication: [
    '/signin',
    '/signup',
    '/email-verification',
    '/password-reset',
    '/two-factor',
  ],
};

const REDIRECTS = {
  authenticated: '/dashboard',
  unauthenticated: '/signin',
};

export default async function middleware(request: NextRequest) {
  const ip = getClientIP(request.headers);

  const { success } = await ratelimit.global.limit(ip);
  if (!success) {
    return new NextResponse('Too many requests', { status: 429 });
  }

  const { pathname } = request.nextUrl;

  const isProtectedRoute = ROUTES.protected.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthenticationRoute = ROUTES.authentication.some((route) =>
    pathname.startsWith(route)
  );

  const session = await getSession();
  if (!session) {
    if (isProtectedRoute) {
      return NextResponse.redirect(
        new URL(REDIRECTS.unauthenticated, request.nextUrl)
      );
    }
  } else {
    if (request.method === 'GET') {
      await updateSession(session);
    }
    if (isAuthenticationRoute) {
      return NextResponse.redirect(
        new URL(REDIRECTS.authenticated, request.nextUrl)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
