import type { NextConfig } from 'next';

function supabaseHostname(): string | null {
  try {
    return process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
}

// Páginas del sitio anterior cuyo destino final todavía no existe (no hay productos en esa categoría
// o falta escribir la guía). Van a lo más cercano con redirect TEMPORAL para no mandar a nadie a un 404;
// cuando exista el destino final (indicado a la derecha), pasar a permanente y apuntar ahí.
const pendingRedirects = [
  ['/desparasitantes-perros.html', '/'], // -> /antipulgas/
  ['/accesorios-perros.html', '/'], // -> /accesorios-perros/
  ['/nexgard-uruguay.html', '/marcas/'], // -> /marcas/nexgard/
  ['/blog/biofresh-vs-equilibrio.html', '/guias/'],
  ['/blog/cada-cuanto-desparasitar-perro.html', '/guias/'],
  ['/blog/casillas-perros.html', '/guias/'],
  ['/blog/como-elegir-racion-perro.html', '/guias/'],
  ['/blog/cuanta-comida-darle-perro.html', '/guias/'],
  ['/landings/cuanta-comida-darle-perro.html', '/guias/'],
  ['/blog/dieta-barf-perros.html', '/guias/'],
  ['/blog/mi-perro-tiene-pulgas-que-hacer.html', '/guias/'],
  ['/blog/pro-plan-gatos.html', '/guias/'],
  ['/landings/guia-desparasitacion-mascotas.html', '/guias/'],
  ['/landings/pulgas-garrapatas-perros.html', '/guias/'],
].map(([source, destination]) => ({ source, destination, permanent: false }));

const nextConfig: NextConfig = {
  // Canonical, sitemap y redirects usan URLs con barra final (/raciones-perros/).
  trailingSlash: true,
  // Apple Wallet llama a /api/wallet/apple/... sin barra final y no sigue redirecciones.
  // La barra de las páginas la agrega proxy.ts (salvo /api y archivos).
  skipTrailingSlashRedirect: true,

  experimental: {
    // Las imágenes se comprimen a WebP en el navegador antes de subirse, pero dejamos margen.
    serverActions: { bodySizeLimit: '4mb' },
  },

  images: {
    remotePatterns: [
      ...(supabaseHostname()
        ? [
            {
              protocol: 'https' as const,
              hostname: supabaseHostname()!,
              pathname: '/storage/v1/object/public/**',
            },
          ]
        : []),
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        // El panel de sellos escanea el QR del cliente con la cámara (pisa el camera=() de arriba).
        source: '/admin/fidelidad/:path*',
        headers: [
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(self)' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // Páginas del sitio anterior que hoy tienen equivalente: redirect permanente.
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/raciones-perros-uruguay.html', destination: '/raciones-perros/', permanent: true },
      { source: '/raciones-cachorros-uruguay.html', destination: '/raciones-perros/cachorros/', permanent: true },
      { source: '/comida-natural-perros.html', destination: '/raciones-perros/', permanent: true },
      { source: '/raciones-gatos-uruguay.html', destination: '/raciones-gatos/', permanent: true },
      { source: '/alimento-gatos-montevideo.html', destination: '/raciones-gatos/', permanent: true },
      { source: '/comida-natural-gatos.html', destination: '/raciones-gatos/', permanent: true },
      { source: '/alimento-perros-montevideo.html', destination: '/envios/', permanent: true },
      { source: '/biofresh-uruguay.html', destination: '/marcas/biofresh/', permanent: true },
      { source: '/equilibrio-uruguay.html', destination: '/marcas/equilibrio/', permanent: true },
      { source: '/catalogo.html', destination: '/', permanent: true },
      { source: '/gracias.html', destination: '/', permanent: true },
      { source: '/admin.html', destination: '/admin/', permanent: true },
      { source: '/blog', destination: '/guias/', permanent: true },
      { source: '/blog/index.html', destination: '/guias/', permanent: true },
      // Páginas viejas de productos que hoy no están en el catálogo: van a la guía del tema
      // (documentado en guides.legacy_urls). Si se cargan productos, la guía puede enlazar a la categoría.
      { source: '/blog/dentastix-perros.html', destination: '/guias/dentastix-para-perros/', permanent: true },
      { source: '/pipetas-perros.html', destination: '/guias/pipetas-para-perros-como-elegirlas-y-aplicarlas/', permanent: true },
      { source: '/pipetas-perros-uruguay.html', destination: '/guias/pipetas-para-perros-como-elegirlas-y-aplicarlas/', permanent: true },
      { source: '/antipulgas-perros-uruguay.html', destination: '/guias/pipetas-para-perros-como-elegirlas-y-aplicarlas/', permanent: true },
      { source: '/arena-para-gatos-uruguay.html', destination: '/guias/arena-para-gatos-como-elegirla/', permanent: true },
      { source: '/blog/arenas-gatos.html', destination: '/guias/arena-para-gatos-como-elegirla/', permanent: true },
      // El panel de sellos con PIN se reemplazó por la sección Fidelidad del admin.
      { source: '/fidelidad/admin', destination: '/admin/fidelidad/', permanent: false },
      ...pendingRedirects,
    ];
  },
};

export default nextConfig;
