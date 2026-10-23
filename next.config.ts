import type { NextConfig } from 'next';

function supabaseHostname(): string | null {
  try {
    return process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
}

// Páginas del sitio anterior cuyo destino final todavía no existe (no hay productos en esa categoría).
// Van a lo más cercano con redirect TEMPORAL para no mandar a nadie a un 404; cuando exista el destino
// final (indicado a la derecha), pasar a permanente y apuntar ahí.
const pendingRedirects = [
  ['/accesorios-perros.html', '/'], // -> /accesorios-perros/
].map(([source, destination]) => ({ source, destination, permanent: false }));

// Artículos del blog viejo: van a la página actual que responde lo mismo (desde el 2026-10-22, cuando las
// categorías pasaron a tener texto y preguntas frecuentes). BARF y casillas no se venden: van a las guías.
const blogRedirects = [
  ['/blog/como-elegir-racion-perro.html', '/raciones-perros/'],
  ['/blog/cuanta-comida-darle-perro.html', '/guias/como-elegir-el-tamano-de-bolsa-segun-el-consumo-de-tu-perro/'],
  ['/landings/cuanta-comida-darle-perro.html', '/guias/como-elegir-el-tamano-de-bolsa-segun-el-consumo-de-tu-perro/'],
  ['/blog/cada-cuanto-desparasitar-perro.html', '/antipulgas/'],
  ['/blog/mi-perro-tiene-pulgas-que-hacer.html', '/antipulgas/'],
  ['/landings/guia-desparasitacion-mascotas.html', '/antipulgas/'],
  ['/landings/pulgas-garrapatas-perros.html', '/antipulgas/'],
  ['/blog/pro-plan-gatos.html', '/marcas/pro-plan/'],
  ['/blog/biofresh-vs-equilibrio.html', '/marcas/'],
  ['/blog/dieta-barf-perros.html', '/guias/'],
  ['/blog/casillas-perros.html', '/guias/'],
].map(([source, destination]) => ({ source, destination, permanent: true }));

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
      // Antipulgas, arena y snacks: los artículos y las páginas de pipetas van a la guía del tema
      // (documentado en guides.legacy_urls; cada guía enlaza a su categoría) y las de venta, a la categoría.
      { source: '/blog/dentastix-perros.html', destination: '/guias/dentastix-para-perros/', permanent: true },
      { source: '/pipetas-perros.html', destination: '/guias/pipetas-para-perros-como-elegirlas-y-aplicarlas/', permanent: true },
      { source: '/pipetas-perros-uruguay.html', destination: '/guias/pipetas-para-perros-como-elegirlas-y-aplicarlas/', permanent: true },
      { source: '/blog/arenas-gatos.html', destination: '/guias/arena-para-gatos-como-elegirla/', permanent: true },
      { source: '/antipulgas-perros-uruguay.html', destination: '/antipulgas/', permanent: true },
      { source: '/desparasitantes-perros.html', destination: '/antipulgas/', permanent: true },
      { source: '/arena-para-gatos-uruguay.html', destination: '/arena-gatos/', permanent: true },
      { source: '/nexgard-uruguay.html', destination: '/marcas/nexgard/', permanent: true },
      // El panel de sellos con PIN se reemplazó por la sección Fidelidad del admin.
      { source: '/fidelidad/admin', destination: '/admin/fidelidad/', permanent: false },
      ...blogRedirects,
      ...pendingRedirects,
    ];
  },
};

export default nextConfig;
