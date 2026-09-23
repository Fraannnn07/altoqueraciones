import 'server-only';
import { supabase } from '@/lib/supabase';
import type { GuideRow } from '@/lib/database.types';
import type { ProductCard } from '@/lib/data/products';

const GUIDE_SELECT =
  'id, slug, title, excerpt, body_markdown, cover_image_path, meta_title, meta_description, status, legacy_urls, published_at';

export async function getPublishedGuides(): Promise<GuideRow[]> {
  const { data } = await supabase()
    .from('guides')
    .select(GUIDE_SELECT)
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  return (data as GuideRow[]) ?? [];
}

export async function getGuideBySlug(slug: string): Promise<GuideRow | null> {
  const { data } = await supabase()
    .from('guides')
    .select(GUIDE_SELECT)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  return (data as GuideRow) ?? null;
}

export async function getGuideRelatedProducts(guideId: number): Promise<ProductCard[]> {
  const { data } = await supabase()
    .from('guide_related_products')
    .select(
      `sort_order,
      product:products(
        id, slug, name, presentation, price_uyu, tier, stock_status,
        brand:brands(id, name, slug),
        images:product_images(storage_path, alt_text, is_primary, sort_order)
      )`,
    )
    .eq('guide_id', guideId)
    .order('sort_order');
  /* eslint-disable @typescript-eslint/no-explicit-any -- filas crudas de Supabase, sin tipos generados */
  return (data ?? [])
    .map((row: any) => row.product)
    .filter(Boolean)
    .map((p: any) => {
      const images = p.images ?? [];
      const primary = images.find((i: any) => i.is_primary) ?? images[0] ?? null;
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        presentation: p.presentation,
        price_uyu: p.price_uyu,
        tier: p.tier,
        stock_status: p.stock_status,
        brand: p.brand,
        primaryImage: primary ? { storage_path: primary.storage_path, alt_text: primary.alt_text } : null,
      } as ProductCard;
    });
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export async function getAllPublishedGuideSlugs(): Promise<string[]> {
  const { data } = await supabase().from('guides').select('slug').eq('status', 'published');
  return (data ?? []).map((g) => g.slug);
}
