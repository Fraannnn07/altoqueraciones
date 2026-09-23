import 'server-only';
import { supabase } from '@/lib/supabase';
import type { ProductRow, ProductImageRow, BrandRow, CategoryRow } from '@/lib/database.types';

export interface ProductCard {
  id: number;
  slug: string;
  name: string;
  presentation: string;
  price_uyu: number;
  net_weight_kg: number | null;
  tier: ProductRow['tier'];
  stock_status: ProductRow['stock_status'];
  brand: Pick<BrandRow, 'id' | 'name' | 'slug'>;
  primaryImage: Pick<ProductImageRow, 'storage_path' | 'alt_text'> | null;
}

export interface ProductDetail extends ProductRow {
  brand: Pick<BrandRow, 'id' | 'name' | 'slug' | 'logo_path'>;
  category: Pick<CategoryRow, 'id' | 'name' | 'slug' | 'parent_id'> & {
    parent: Pick<CategoryRow, 'id' | 'name' | 'slug'> | null;
  };
  images: ProductImageRow[];
}

const CARD_SELECT = `
  id, slug, name, presentation, price_uyu, net_weight_kg, tier, stock_status,
  brand:brands!inner(id, name, slug),
  images:product_images(storage_path, alt_text, is_primary, sort_order)
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- fila cruda de Supabase, sin tipos generados
function toCard(row: any): ProductCard {
  const images = (row.images ?? []) as ProductImageRow[];
  const primary = images.find((i) => i.is_primary) ?? images.sort((a, b) => a.sort_order - b.sort_order)[0] ?? null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    presentation: row.presentation,
    price_uyu: row.price_uyu,
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
  const { data } = await supabase()
    .from('products')
    .select(CARD_SELECT)
    .in('category_id', categoryIds)
    .eq('active', true)
    .order('sort_order');
  return (data ?? []).map(toCard);
}

export async function getProductsByBrandId(brandId: number): Promise<ProductCard[]> {
  const { data } = await supabase()
    .from('products')
    .select(CARD_SELECT)
    .eq('brand_id', brandId)
    .eq('active', true)
    .order('sort_order');
  return (data ?? []).map(toCard);
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const { data } = await supabase()
    .from('products')
    .select(
      `*,
      brand:brands(id, name, slug, logo_path),
      category:categories(id, name, slug, parent_id, parent:parent_id(id, name, slug)),
      images:product_images(*)`,
    )
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();
  if (!data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- fila cruda de Supabase, sin tipos generados
  const raw = data as any;
  const images = (raw.images ?? []) as ProductImageRow[];
  images.sort((a, b) => a.sort_order - b.sort_order);
  return { ...raw, images } as ProductDetail;
}

export async function getRelatedProducts(
  categoryId: number,
  excludeProductId: number,
  limit = 4,
): Promise<ProductCard[]> {
  const { data } = await supabase()
    .from('products')
    .select(CARD_SELECT)
    .eq('category_id', categoryId)
    .eq('active', true)
    .neq('id', excludeProductId)
    .order('sort_order')
    .limit(limit);
  return (data ?? []).map(toCard);
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCard[]> {
  const { data } = await supabase()
    .from('products')
    .select(CARD_SELECT)
    .eq('active', true)
    .eq('featured', true)
    .order('sort_order')
    .limit(limit);
  return (data ?? []).map(toCard);
}

/** Todos los productos activos (sin tope), p. ej. para la tabla comparativa de precio por kilo. */
export async function getAllActiveProducts(): Promise<ProductCard[]> {
  const { data } = await supabase()
    .from('products')
    .select(CARD_SELECT)
    .eq('active', true)
    .order('sort_order');
  return (data ?? []).map(toCard);
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

export interface FeedProduct {
  slug: string;
  name: string;
  presentation: string;
  short_description: string;
  long_description: string;
  price_uyu: number;
  stock_status: ProductRow['stock_status'];
  brand: Pick<BrandRow, 'name'>;
  primaryImage: Pick<ProductImageRow, 'storage_path'> | null;
}

export async function getActiveProductsForFeed(): Promise<FeedProduct[]> {
  const { data } = await supabase()
    .from('products')
    .select(
      `slug, name, presentation, short_description, long_description, price_uyu, stock_status,
      brand:brands(name),
      images:product_images(storage_path, is_primary, sort_order)`,
    )
    .eq('active', true);
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
      price_uyu: row.price_uyu,
      stock_status: row.stock_status,
      brand: row.brand,
      primaryImage: primary ? { storage_path: primary.storage_path } : null,
    };
  });
}
