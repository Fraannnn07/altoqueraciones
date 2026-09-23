import type { NextConfig } from 'next';

function supabaseHostname(): string | null {
  try {
    return process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
}

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
      // ---- hubs comerciales ----
      { source: '/raciones-perros-uruguay.html', destination: '/raciones-perros/', permanent: true },
      { source: '/raciones-gatos-uruguay.html', destination: '/raciones-gatos/', permanent: true },
      { source: '/raciones-cachorros-uruguay.html', destination: '/raciones-perros/cachorros/', permanent: true },
      { source: '/antipulgas-perros-uruguay.html', destination: '/antipulgas/', permanent: true },
      { source: '/arena-para-gatos-uruguay.html', destination: '/arena-gatos/', permanent: true },
      { source: '/accesorios-perros.html', destination: '/accesorios-perros/', permanent: true },
      { source: '/catalogo.html', destination: '/', permanent: true },

      // ---- cadenas legacy ya consolidadas, colapsadas a un solo salto ----
      { source: '/comida-natural-perros.html', destination: '/raciones-perros/', permanent: true },
      { source: '/comida-natural-gatos.html', destination: '/raciones-gatos/', permanent: true },
      { source: '/desparasitantes-perros.html', destination: '/antipulgas/', permanent: true },
      { source: '/pipetas-perros.html', destination: '/antipulgas/', permanent: true },
      { source: '/pipetas-perros-uruguay.html', destination: '/antipulgas/', permanent: true },
      { source: '/alimento-gatos-montevideo.html', destination: '/raciones-gatos/', permanent: true },
      { source: '/alimento-perros-montevideo.html', destination: '/envios/', permanent: true },

      // ---- marcas ----
      { source: '/biofresh-uruguay.html', destination: '/marcas/biofresh/', permanent: true },
      { source: '/equilibrio-uruguay.html', destination: '/marcas/equilibrio/', permanent: true },
      { source: '/nexgard-uruguay.html', destination: '/marcas/nexgard/', permanent: true },

      // ---- varios ----
      { source: '/gracias.html', destination: '/', permanent: true },
      { source: '/admin.html', destination: '/admin/', permanent: true },

      // ---- guías (blog + landings) ----
      { source: '/blog', destination: '/guias/', permanent: true },
      { source: '/blog/index.html', destination: '/guias/', permanent: true },
      {
        source: '/blog/arenas-gatos.html',
        destination: '/guias/arenas-para-gatos-bentonita-silica-o-tofu/',
        permanent: true,
      },
      {
        source: '/blog/biofresh-vs-equilibrio.html',
        destination: '/guias/biofresh-vs-equilibrio-cual-elegir/',
        permanent: true,
      },
      {
        source: '/blog/cada-cuanto-desparasitar-perro.html',
        destination: '/guias/cada-cuanto-desparasitar-a-tu-perro/',
        permanent: true,
      },
      {
        source: '/blog/casillas-perros.html',
        destination: '/guias/como-elegir-el-tamano-de-casilla-para-tu-perro/',
        permanent: true,
      },
      {
        source: '/blog/como-elegir-racion-perro.html',
        destination: '/guias/como-elegir-la-mejor-racion-para-tu-perro/',
        permanent: true,
      },
      {
        source: '/blog/cuanta-comida-darle-perro.html',
        destination: '/guias/cuanta-comida-darle-a-tu-perro-por-dia/',
        permanent: true,
      },
      {
        source: '/landings/cuanta-comida-darle-perro.html',
        destination: '/guias/cuanta-comida-darle-a-tu-perro-por-dia/',
        permanent: true,
      },
      {
        source: '/blog/dentastix-perros.html',
        destination: '/guias/dentastix-para-perros-beneficios-y-frecuencia/',
        permanent: true,
      },
      {
        source: '/blog/dieta-barf-perros.html',
        destination: '/guias/dieta-barf-para-perros-guia-completa/',
        permanent: true,
      },
      {
        source: '/blog/mi-perro-tiene-pulgas-que-hacer.html',
        destination: '/guias/mi-perro-tiene-pulgas-que-hacer/',
        permanent: true,
      },
      {
        source: '/blog/pro-plan-gatos.html',
        destination: '/guias/pro-plan-para-gatos-por-que-lo-recomiendan-los-veterinarios/',
        permanent: true,
      },
      {
        source: '/landings/guia-desparasitacion-mascotas.html',
        destination: '/guias/calendario-de-desparasitacion-para-perros-y-gatos/',
        permanent: true,
      },
      {
        source: '/landings/pulgas-garrapatas-perros.html',
        destination: '/guias/pulgas-y-garrapatas-en-perros-que-hacer/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
