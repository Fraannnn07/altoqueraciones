import type { MetadataRoute } from 'next';
import { categoryProductCount, getActiveRootCategories, getSubcategories } from '@/lib/data/categories';
import { getActiveBrandsWithProducts } from '@/lib/data/brands';
import { getAllActiveProductSlugs } from '@/lib/data/products';
import { getPublishedGuides } from '@/lib/data/guides';
import { siteConfig } from '@/lib/site-config';

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
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [rootCategories, brands, productSlugs, guides] = await Promise.all([
    getActiveRootCategories(),
    getActiveBrandsWithProducts(),
    getAllActiveProductSlugs(),
    getPublishedGuides(),
  ]);

  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${siteConfig.url}/${path ? `${path}/` : ''}`,
    priority: path === '' ? 1 : 0.6,
  }));

  for (const category of rootCategories) {
    entries.push({ url: `${siteConfig.url}/${category.slug}/`, priority: 0.9 });
    const subcategories = await getSubcategories(category.id);
    for (const sub of subcategories) {
      const count = await categoryProductCount(sub.id, false);
      if (count === 0) continue;
      entries.push({ url: `${siteConfig.url}/${category.slug}/${sub.slug}/`, priority: 0.8 });
    }
  }

  for (const brand of brands) {
    entries.push({ url: `${siteConfig.url}/marcas/${brand.slug}/`, priority: 0.7 });
  }

  for (const slug of productSlugs) {
    entries.push({ url: `${siteConfig.url}/producto/${slug}/`, priority: 0.7 });
  }

  for (const guide of guides) {
    entries.push({ url: `${siteConfig.url}/guias/${guide.slug}/`, priority: 0.5 });
  }

  return entries;
}
