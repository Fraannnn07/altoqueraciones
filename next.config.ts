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
  ['/raciones-cachorros-uruguay.html', '/raciones-perros/'], // -> /raciones-perros/cachorros/
  ['/raciones-gatos-uruguay.html', '/'], // -> /raciones-gatos/
  ['/alimento-gatos-montevideo.html', '/'], // -> /raciones-gatos/
  ['/comida-natural-gatos.html', '/'], // -> /raciones-gatos/
  ['/antipulgas-perros-uruguay.html', '/'], // -> /antipulgas/
  ['/desparasitantes-perros.html', '/'], // -> /antipulgas/
  ['/pipetas-perros.html', '/'], // -> /antipulgas/
  ['/pipetas-perros-uruguay.html', '/'], // -> /antipulgas/
  ['/arena-para-gatos-uruguay.html', '/'], // -> /arena-gatos/
  ['/accesorios-perros.html', '/'], // -> /accesorios-perros/
  ['/nexgard-uruguay.html', '/marcas/'], // -> /marcas/nexgard/
  ['/blog/arenas-gatos.html', '/guias/'],
  ['/blog/biofresh-vs-equilibrio.html', '/guias/'],
  ['/blog/cada-cuanto-desparasitar-perro.html', '/guias/'],
  ['/blog/casillas-perros.html', '/guias/'],
  ['/blog/como-elegir-racion-perro.html', '/guias/'],
  ['/blog/cuanta-comida-darle-perro.html', '/guias/'],
  ['/landings/cuanta-comida-darle-perro.html', '/guias/'],
  ['/blog/dentastix-perros.html', '/guias/'],
  ['/blog/dieta-barf-perros.html', '/guias/'],
  ['/blog/mi-perro-tiene-pulgas-que-hacer.html', '/guias/'],
  ['/blog/pro-plan-gatos.html', '/guias/'],
  ['/landings/guia-desparasitacion-mascotas.html', '/guias/'],
  ['/landings/pulgas-garrapatas-perros.html', '/guias/'],
].map(([source, destination]) => ({ source, destination, permanent: false }));

const nextConfig: NextConfig = {
  // Canonical, sitemap y redirects usan URLs con barra final (/raciones-perros/).
  trailingSlash: true,

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
    ];
  },

  async redirects() {
    return [
      // Páginas del sitio anterior que hoy tienen equivalente: redirect permanente.
      { source: '/raciones-perros-uruguay.html', destination: '/raciones-perros/', permanent: true },
      { source: '/comida-natural-perros.html', destination: '/raciones-perros/', permanent: true },
      { source: '/alimento-perros-montevideo.html', destination: '/envios/', permanent: true },
      { source: '/biofresh-uruguay.html', destination: '/marcas/biofresh/', permanent: true },
      { source: '/equilibrio-uruguay.html', destination: '/marcas/equilibrio/', permanent: true },
      { source: '/catalogo.html', destination: '/', permanent: true },
      { source: '/gracias.html', destination: '/', permanent: true },
      { source: '/admin.html', destination: '/admin/', permanent: true },
      { source: '/blog', destination: '/guias/', permanent: true },
      { source: '/blog/index.html', destination: '/guias/', permanent: true },
      ...pendingRedirects,
    ];
  },
};

export default nextConfig;
