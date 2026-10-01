import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-session';

// Next 16: "proxy" reemplaza a "middleware". Hace dos cosas:
//
// 1) Barra final en las páginas. next.config tiene skipTrailingSlashRedirect porque Apple Wallet llama a
//    /api/wallet/apple/... sin "/" final y no sigue redirecciones; entonces la barra la agrega este proxy
//    (308, como antes). El matcher deja afuera /api, /_next, /_vercel, /.well-known y los archivos
//    (robots.txt, sitemap.xml, imágenes), que se sirven tal cual.
//
// 2) Protege todo /admin salvo el login. Las Server Actions vuelven a verificar la sesión por su cuenta
//    (requireAdmin).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const lastSegment = pathname.slice(pathname.lastIndexOf('/') + 1);

  if (!pathname.endsWith('/') && !lastSegment.includes('.')) {
    // request.nextUrl.clone() vuelve a sacar la "/" final y genera un loop; por eso se arma a mano.
    const url = new URL(request.url);
    url.pathname = `${pathname}/`;
    return NextResponse.redirect(url.toString(), 308);
  }

  if (pathname.startsWith('/admin/')) return protectAdmin(request, pathname);

  return NextResponse.next();
}

function protectAdmin(request: NextRequest, pathname: string) {
  const authed = verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
  const isLogin = pathname.replace(/\/+$/, '') === '/admin/login';

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
  matcher: ['/((?!api/|_next/|_vercel/|\\.well-known/|.*\\.[^/]*$).*)'],
};
