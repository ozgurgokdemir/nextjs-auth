import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateSession } from '@/lib/auth/session';

const protectedRoutes = ['/dashboard'];
const publicRoutes = ['/signin', '/signup', '/'];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.includes(pathname);
  const isPublicRoute = publicRoutes.includes(pathname);

  const session = await getSession();

  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/signin', request.nextUrl));
  }

  if (session) {
    await updateSession(session);
  }

  if (session && isPublicRoute && !pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
