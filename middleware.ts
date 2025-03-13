import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateSession } from '@/lib/auth/session';

const ROUTES = {
  protected: ['/dashboard'],
  authentication: ['/signin', '/signup'],
};

const REDIRECTS = {
  authenticated: '/dashboard',
  unauthenticated: '/signin',
};

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = ROUTES.protected.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthenticationRoute = ROUTES.authentication.some((route) =>
    pathname.startsWith(route)
  );

  const session = await getSession();

  if (!session && isProtectedRoute) {
    return NextResponse.redirect(
      new URL(REDIRECTS.unauthenticated, request.nextUrl)
    );
  }

  if (session) {
    await updateSession(session);
  }

  if (session && isAuthenticationRoute) {
    return NextResponse.redirect(
      new URL(REDIRECTS.authenticated, request.nextUrl)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
