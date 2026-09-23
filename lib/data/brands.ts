import 'server-only';
import { supabase } from '@/lib/supabase';
import type { BrandRow } from '@/lib/database.types';

const BRAND_SELECT =
  'id, name, slug, logo_path, description, meta_title, meta_description, active, sort_order';

export async function getBrandBySlug(slug: string): Promise<BrandRow | null> {
  const { data } = await supabase()
    .from('brands')
    .select(BRAND_SELECT)
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();
  return (data as BrandRow) ?? null;
}

/** Marcas activas con al menos un producto activo, para /marcas/ y nav. */
export async function getActiveBrandsWithProducts(): Promise<(BrandRow & { productCount: number })[]> {
  const db = supabase();
  const [{ data: brands }, { data: counts }] = await Promise.all([
    db.from('brands').select(BRAND_SELECT).eq('active', true).order('sort_order'),
    db.from('brand_active_product_counts').select('brand_id, n'),
  ]);
  const countMap = new Map((counts ?? []).map((c) => [c.brand_id, c.n]));
  return (brands ?? [])
    .map((b) => ({ ...(b as BrandRow), productCount: countMap.get(b.id) ?? 0 }))
    .filter((b) => b.productCount > 0);
}
