import 'server-only';
import { supabase } from '@/lib/supabase';
import type { GuideRow } from '@/lib/database.types';
import { CARD_SELECT, toCard, type ProductCard } from '@/lib/data/products';
import { getSiteDiscountPercent } from '@/lib/data/site-settings';

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
  const [{ data }, sitePercent] = await Promise.all([
    supabase()
      .from('guide_related_products')
      .select(`sort_order, product:products(${CARD_SELECT})`)
      .eq('guide_id', guideId)
      .order('sort_order'),
    getSiteDiscountPercent(),
  ]);
  /* eslint-disable @typescript-eslint/no-explicit-any -- filas crudas de Supabase, sin tipos generados */
  return (data ?? [])
    .map((row: any) => row.product)
    .filter(Boolean)
    .map((product: any) => toCard(product, sitePercent));
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export async function getAllPublishedGuideSlugs(): Promise<string[]> {
  const { data } = await supabase().from('guides').select('slug').eq('status', 'published');
  return (data ?? []).map((g) => g.slug);
}
