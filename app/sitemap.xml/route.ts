import { categoryProductCount, getActiveRootCategories, getSubcategories } from '@/lib/data/categories';
import { getActiveBrandsWithProducts } from '@/lib/data/brands';
import { getActiveProductsForSitemap } from '@/lib/data/products';
import { getPublishedGuides } from '@/lib/data/guides';
import { siteConfig } from '@/lib/site-config';

// Route handler común (no la convención app/sitemap.ts): en Vercel el sitemap de
// metadata quedaba congelado con el contenido del build y no respetaba ni el
// revalidate ni el revalidatePath del admin. El feed, que es un route handler, sí
// se regenera bien.
export const revalidate = 3600;

const STATIC_PATHS = [
  '',
  'marcas',
  'guias',
  'nosotros',
  'contacto',
  'envios',
  'medios-de-pago',
  'cambios-y-devoluciones',
  'preguntas-frecuentes',
  'soporte',
];

interface Entry {
  path: string;
  priority: number;
  lastmod?: string;
}

function xmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function GET() {
  const [rootCategories, brands, products, guides] = await Promise.all([
    getActiveRootCategories(),
    getActiveBrandsWithProducts(),
    getActiveProductsForSitemap(),
    getPublishedGuides(),
  ]);

  const entries: Entry[] = STATIC_PATHS.map((path) => ({
    path: path ? `/${path}/` : '/',
    priority: path === '' ? 1 : 0.6,
  }));

  const categoryEntries = await Promise.all(
    rootCategories.map(async (category) => {
      const subcategories = await getSubcategories(category.id);
      const counts = await Promise.all(subcategories.map((sub) => categoryProductCount(sub.id, false)));
      return [
        { path: `/${category.slug}/`, priority: 0.9 },
        ...subcategories
          .filter((_, i) => counts[i] > 0)
          .map((sub) => ({ path: `/${category.slug}/${sub.slug}/`, priority: 0.8 })),
      ];
    }),
  );
  entries.push(...categoryEntries.flat());

  for (const brand of brands) {
    entries.push({ path: `/marcas/${brand.slug}/`, priority: 0.7 });
  }

  for (const product of products) {
    entries.push({ path: `/producto/${product.slug}/`, priority: 0.7, lastmod: product.updated_at });
  }

  for (const guide of guides) {
    entries.push({ path: `/guias/${guide.slug}/`, priority: 0.5, lastmod: guide.published_at ?? undefined });
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(
      (entry) =>
        `<url><loc>${xmlEscape(`${siteConfig.url}${entry.path}`)}</loc>${
          entry.lastmod ? `<lastmod>${new Date(entry.lastmod).toISOString()}</lastmod>` : ''
        }<priority>${entry.priority}</priority></url>`,
    ),
    '</urlset>',
  ].join('\n');

  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
}
