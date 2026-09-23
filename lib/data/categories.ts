import 'server-only';
import { supabase } from '@/lib/supabase';
import type { CategoryRow } from '@/lib/database.types';

const CATEGORY_SELECT =
  'id, parent_id, name, slug, species, intro_html, faq, meta_title, meta_description, image_path, active, sort_order';

/** Categoría raíz (sin parent) por slug, o subcategoría por (parentSlug, slug). */
export async function getCategoryBySlug(slug: string, parentSlug?: string): Promise<CategoryRow | null> {
  const db = supabase();
  if (parentSlug) {
    const { data: parent } = await db
      .from('categories')
      .select('id')
      .eq('slug', parentSlug)
      .is('parent_id', null)
      .maybeSingle();
    if (!parent) return null;
    const { data } = await db
      .from('categories')
      .select(CATEGORY_SELECT)
      .eq('slug', slug)
      .eq('parent_id', parent.id)
      .eq('active', true)
      .maybeSingle();
    return (data as CategoryRow) ?? null;
  }
  const { data } = await db
    .from('categories')
    .select(CATEGORY_SELECT)
    .eq('slug', slug)
    .is('parent_id', null)
    .eq('active', true)
    .maybeSingle();
  return (data as CategoryRow) ?? null;
}

export async function getSubcategories(parentId: number): Promise<CategoryRow[]> {
  const { data } = await supabase()
    .from('categories')
    .select(CATEGORY_SELECT)
    .eq('parent_id', parentId)
    .eq('active', true)
    .order('sort_order');
  return (data as CategoryRow[]) ?? [];
}

/** Todas las categorías raíz activas y con productos, para nav/sitemap. */
export async function getActiveRootCategories(): Promise<(CategoryRow & { productCount: number })[]> {
  const db = supabase();
  const [{ data: cats }, { data: counts }] = await Promise.all([
    db.from('categories').select(CATEGORY_SELECT).is('parent_id', null).eq('active', true).order('sort_order'),
    db.from('category_active_product_counts').select('category_id, n'),
  ]);
  const countMap = new Map((counts ?? []).map((c) => [c.category_id, c.n]));
  const withDescendants = await Promise.all(
    (cats ?? []).map(async (c) => {
      const { data: children } = await db.from('categories').select('id').eq('parent_id', c.id);
      const ids = [c.id, ...(children ?? []).map((ch) => ch.id)];
      const total = ids.reduce((sum, id) => sum + (countMap.get(id) ?? 0), 0);
      return { ...(c as CategoryRow), productCount: total };
    }),
  );
  return withDescendants.filter((c) => c.productCount > 0);
}

export async function categoryProductCount(categoryId: number, includeChildren: boolean): Promise<number> {
  const db = supabase();
  const ids = [categoryId];
  if (includeChildren) {
    const { data: children } = await db.from('categories').select('id').eq('parent_id', categoryId);
    ids.push(...(children ?? []).map((c) => c.id));
  }
  const { count } = await db
    .from('products')
    .select('id', { count: 'exact', head: true })
    .in('category_id', ids)
    .eq('active', true);
  return count ?? 0;
}
