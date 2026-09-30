import 'server-only';
import { supabase } from '@/lib/supabase';
import { getSiteDiscountPercent } from '@/lib/data/site-settings';
import { buildPricing, type Pricing } from '@/lib/pricing';
import type { ProductRow, ProductImageRow, BrandRow, CategoryRow } from '@/lib/database.types';

export interface ProductCard {
  id: number;
  slug: string;
  name: string;
  presentation: string;
  /** Precio de lista y precio final con el descuento que corresponda (general o propio). */
  pricing: Pricing;
  net_weight_kg: number | null;
  tier: ProductRow['tier'];
  stock_status: ProductRow['stock_status'];
  brand: Pick<BrandRow, 'id' | 'name' | 'slug'>;
  primaryImage: Pick<ProductImageRow, 'storage_path' | 'alt_text'> | null;
}

export interface ProductDetail extends ProductRow {
  pricing: Pricing;
  brand: Pick<BrandRow, 'id' | 'name' | 'slug' | 'logo_path'>;
  category: Pick<CategoryRow, 'id' | 'name' | 'slug' | 'parent_id'> & {
    parent: Pick<CategoryRow, 'id' | 'name' | 'slug'> | null;
  };
  images: ProductImageRow[];
}

export const CARD_SELECT = `
  id, slug, name, presentation, price_uyu, discount_percent, net_weight_kg, tier, stock_status,
  brand:brands!inner(id, name, slug),
  images:product_images(storage_path, alt_text, is_primary, sort_order)
`;

/** Arma la ficha a partir de una fila con CARD_SELECT; `sitePercent` es el descuento general vigente. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- fila cruda de Supabase, sin tipos generados
export function toCard(row: any, sitePercent: number): ProductCard {
  const images = (row.images ?? []) as ProductImageRow[];
  const primary = images.find((i) => i.is_primary) ?? images.sort((a, b) => a.sort_order - b.sort_order)[0] ?? null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    presentation: row.presentation,
    pricing: buildPricing(row.price_uyu, row.discount_percent, sitePercent),
    net_weight_kg: row.net_weight_kg,
    tier: row.tier,
    stock_status: row.stock_status,
    brand: row.brand,
    primaryImage: primary ? { storage_path: primary.storage_path, alt_text: primary.alt_text } : null,
  };
}

/** Fichas de producto de una categoría (incluir subcategorías: pasar sus ids también). */
export async function getProductsByCategoryIds(categoryIds: number[]): Promise<ProductCard[]> {
  if (categoryIds.length === 0) return [];
  const [{ data }, sitePercent] = await Promise.all([
    supabase().from('products').select(CARD_SELECT).in('category_id', categoryIds).eq('active', true).order('sort_order'),
    getSiteDiscountPercent(),
  ]);
  return (data ?? []).map((row) => toCard(row, sitePercent));
}

export async function getProductsByBrandId(brandId: number): Promise<ProductCard[]> {
  const [{ data }, sitePercent] = await Promise.all([
    supabase().from('products').select(CARD_SELECT).eq('brand_id', brandId).eq('active', true).order('sort_order'),
    getSiteDiscountPercent(),
  ]);
  return (data ?? []).map((row) => toCard(row, sitePercent));
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const [{ data }, sitePercent] = await Promise.all([
    supabase()
      .from('products')
      .select(
        `*,
        brand:brands(id, name, slug, logo_path),
        category:categories(id, name, slug, parent_id, parent:parent_id(id, name, slug)),
        images:product_images(*)`,
      )
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle(),
    getSiteDiscountPercent(),
  ]);
  if (!data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- fila cruda de Supabase, sin tipos generados
  const raw = data as any;
  const images = (raw.images ?? []) as ProductImageRow[];
  images.sort((a, b) => a.sort_order - b.sort_order);
  const pricing = buildPricing(raw.price_uyu, raw.discount_percent, sitePercent);
  return { ...raw, images, pricing } as ProductDetail;
}

export async function getRelatedProducts(
  categoryId: number,
  excludeProductId: number,
  limit = 4,
): Promise<ProductCard[]> {
  const [{ data }, sitePercent] = await Promise.all([
    supabase()
      .from('products')
      .select(CARD_SELECT)
      .eq('category_id', categoryId)
      .eq('active', true)
      .neq('id', excludeProductId)
      .order('sort_order')
      .limit(limit),
    getSiteDiscountPercent(),
  ]);
  return (data ?? []).map((row) => toCard(row, sitePercent));
}

/**
 * Destacados del inicio. Los productos con descuento propio entran solos y van primero (todos, aunque
 * pasen el tope); los marcados como destacados completan hasta `limit`. El descuento general no cuenta:
 * si no, con la tienda entera en oferta todo el catálogo sería destacado.
 */
export async function getFeaturedProducts(limit = 8): Promise<ProductCard[]> {
  const [{ data }, sitePercent] = await Promise.all([
    supabase()
      .from('products')
      .select(CARD_SELECT)
      .eq('active', true)
      .or('featured.eq.true,discount_percent.gt.0')
      .order('sort_order'),
    getSiteDiscountPercent(),
  ]);
  const rows = data ?? [];
  const onSale = rows.filter((row) => row.discount_percent > 0);
  const featured = rows.filter((row) => !(row.discount_percent > 0)).slice(0, Math.max(0, limit - onSale.length));
  return [...onSale, ...featured].map((row) => toCard(row, sitePercent));
}

/** Todos los productos activos (sin tope), p. ej. para la tabla comparativa de precio por kilo. */
export async function getAllActiveProducts(): Promise<ProductCard[]> {
  const [{ data }, sitePercent] = await Promise.all([
    supabase().from('products').select(CARD_SELECT).eq('active', true).order('sort_order'),
    getSiteDiscountPercent(),
  ]);
  return (data ?? []).map((row) => toCard(row, sitePercent));
}

export interface SearchableProduct extends ProductCard {
  /** Categoría y categoría padre ("Cachorros", "Raciones para Perros"), para que el buscador las tenga en cuenta. */
  categoryNames: string[];
}

/** Todos los productos activos con los nombres de su categoría, para el buscador (filtra lib/search.ts). */
export async function getSearchableProducts(): Promise<SearchableProduct[]> {
  const [{ data }, sitePercent] = await Promise.all([
    supabase()
      .from('products')
      .select(`${CARD_SELECT}, category:categories(name, parent:parent_id(name))`)
      .eq('active', true)
      .order('sort_order'),
    getSiteDiscountPercent(),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- fila cruda de Supabase, sin tipos generados
  return (data ?? []).map((row: any) => ({
    ...toCard(row, sitePercent),
    categoryNames: [row.category?.name, row.category?.parent?.name].filter(Boolean),
  }));
}

/** Si un slug es de un nombre anterior de un producto, devuelve el slug actual (para redirigir con 308). */
export async function getProductSlugRedirect(oldSlug: string): Promise<string | null> {
  const { data } = await supabase()
    .from('products')
    .select('slug')
    .contains('previous_slugs', [oldSlug])
    .eq('active', true)
    .maybeSingle();
  return data?.slug ?? null;
}

/** Todos los slugs activos, para generateStaticParams. */
export async function getAllActiveProductSlugs(): Promise<string[]> {
  const { data } = await supabase().from('products').select('slug').eq('active', true);
  return (data ?? []).map((p) => p.slug);
}

/** Slug + última modificación de los productos activos, para el <lastmod> del sitemap. */
export async function getActiveProductsForSitemap(): Promise<{ slug: string; updated_at: string }[]> {
  const { data } = await supabase().from('products').select('slug, updated_at').eq('active', true).order('id');
  return data ?? [];
}

export interface FeedProduct {
  slug: string;
  name: string;
  presentation: string;
  short_description: string;
  long_description: string;
  pricing: Pricing;
  stock_status: ProductRow['stock_status'];
  brand: Pick<BrandRow, 'name'>;
  primaryImage: Pick<ProductImageRow, 'storage_path'> | null;
}

export async function getActiveProductsForFeed(): Promise<FeedProduct[]> {
  const [{ data }, sitePercent] = await Promise.all([
    supabase()
      .from('products')
      .select(
        `slug, name, presentation, short_description, long_description, price_uyu, discount_percent, stock_status,
        brand:brands(name),
        images:product_images(storage_path, is_primary, sort_order)`,
      )
      .eq('active', true),
    getSiteDiscountPercent(),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- fila cruda de Supabase, sin tipos generados
  return (data ?? []).map((row: any) => {
    const images = (row.images ?? []) as ProductImageRow[];
    const primary = images.find((i) => i.is_primary) ?? images.sort((a, b) => a.sort_order - b.sort_order)[0];
    return {
      slug: row.slug,
      name: row.name,
      presentation: row.presentation,
      short_description: row.short_description,
      long_description: row.long_description,
      pricing: buildPricing(row.price_uyu, row.discount_percent, sitePercent),
      stock_status: row.stock_status,
      brand: row.brand,
      primaryImage: primary ? { storage_path: primary.storage_path } : null,
    };
  });
}
