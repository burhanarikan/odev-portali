import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = [
  '/dashboard',
  '/teacher',
  '/student',
  '/assignments',
  '/students',
  '/analytics',
  '/submissions',
  '/attendance',
  '/evaluations',
  '/portfolio',
  '/settings',
  '/announcements',
  '/timeline',
  '/error-bank',
  '/teacher-resources',
  '/teacher-wiki',
  '/intervention',
  '/makeup',
  '/peer-review',
];

function isProtected(pathname: string) {
  return protectedPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  if (isProtected(pathname)) {
    if (!token) {
      const login = new URL('/login', req.url);
      login.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(login);
    }
    const role = token.role as string | undefined;
    if (pathname === '/dashboard' || pathname === '/dashboard/') {
      if (role === 'STUDENT') return NextResponse.redirect(new URL('/dashboard/student', req.url));
      if (role === 'TEACHER' || role === 'ADMIN') return NextResponse.redirect(new URL('/dashboard/teacher', req.url));
    }
  }

  if (pathname === '/' || pathname === '') {
    if (token) {
      const role = token.role as string | undefined;
      if (role === 'STUDENT') return NextResponse.redirect(new URL('/dashboard/student', req.url));
      if (role === 'TEACHER' || role === 'ADMIN') return NextResponse.redirect(new URL('/dashboard/teacher', req.url));
      return NextResponse.redirect(new URL('/dashboard/teacher', req.url));
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
};
