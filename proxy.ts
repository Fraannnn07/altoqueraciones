import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-session';

// Next 16: "proxy" reemplaza a "middleware". Protege todo /admin salvo el login.
// Las Server Actions vuelven a verificar la sesión por su cuenta (requireAdmin).
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace(/\/+$/, '') || '/';
  const authed = verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
  const isLogin = pathname === '/admin/login';

  if (!authed && !isLogin) {
    return NextResponse.redirect(new URL('/admin/login/', request.url));
  }
  if (authed && isLogin) {
    return NextResponse.redirect(new URL('/admin/', request.url));
  }

  const response = NextResponse.next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
