import 'server-only';
import { supabase } from '@/lib/supabase';
import type { BrandRow, CategoryRow, ProductImageRow, ProductRow } from '@/lib/database.types';

export interface AdminProductListItem {
  id: number;
  slug: string;
  name: string;
  presentation: string;
  price_uyu: number;
  net_weight_kg: number | null;
  active: boolean;
  featured: boolean;
  stock_status: ProductRow['stock_status'];
  brandName: string;
  categoryName: string;
  imageCount: number;
}

export async function getAdminProducts(): Promise<AdminProductListItem[]> {
  const { data } = await supabase()
    .from('products')
    .select(
      `id, slug, name, presentation, price_uyu, net_weight_kg, active, featured, stock_status,
      brand:brands(name), category:categories(name), images:product_images(id)`,
    )
    .order('sort_order')
    .order('id');
  /* eslint-disable @typescript-eslint/no-explicit-any -- filas crudas de Supabase, sin tipos generados */
  return (data ?? []).map((row: any) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    presentation: row.presentation,
    price_uyu: row.price_uyu,
    net_weight_kg: row.net_weight_kg,
    active: row.active,
    featured: row.featured,
    stock_status: row.stock_status,
    brandName: row.brand?.name ?? '—',
    categoryName: row.category?.name ?? '—',
    imageCount: (row.images ?? []).length,
  }));
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export async function getAdminProduct(
  id: number,
): Promise<(ProductRow & { images: ProductImageRow[] }) | null> {
  const { data } = await supabase()
    .from('products')
    .select('*, images:product_images(*)')
    .eq('id', id)
    .maybeSingle();
  if (!data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- fila cruda de Supabase, sin tipos generados
  const raw = data as any;
  const images = ((raw.images ?? []) as ProductImageRow[]).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  return { ...raw, images } as ProductRow & { images: ProductImageRow[] };
}

export async function getAdminBrands(): Promise<(BrandRow & { productCount: number })[]> {
  const db = supabase();
  const [{ data: brands }, { data: products }] = await Promise.all([
    db.from('brands').select('*').order('name'),
    db.from('products').select('brand_id'),
  ]);
  const counts = new Map<number, number>();
  for (const p of products ?? []) counts.set(p.brand_id, (counts.get(p.brand_id) ?? 0) + 1);
  return ((brands ?? []) as BrandRow[]).map((b) => ({ ...b, productCount: counts.get(b.id) ?? 0 }));
}

export interface CategoryOption {
  id: number;
  label: string;
}

/** Categorías para el selector del formulario: "Raciones para Perros" y "Raciones para Perros › Adultos". */
export async function getCategoryOptions(): Promise<CategoryOption[]> {
  const { data } = await supabase()
    .from('categories')
    .select('id, parent_id, name, sort_order')
    .eq('active', true)
    .order('sort_order');
  const rows = (data ?? []) as Pick<CategoryRow, 'id' | 'parent_id' | 'name' | 'sort_order'>[];
  const roots = rows.filter((c) => c.parent_id === null);
  const options: CategoryOption[] = [];
  for (const root of roots) {
    options.push({ id: root.id, label: root.name });
    for (const child of rows.filter((c) => c.parent_id === root.id)) {
      options.push({ id: child.id, label: `${root.name} › ${child.name}` });
    }
  }
  return options;
}

export async function getDashboardCounts() {
  const db = supabase();
  const [products, activeProducts, brands, guides] = await Promise.all([
    db.from('products').select('id', { count: 'exact', head: true }),
    db.from('products').select('id', { count: 'exact', head: true }).eq('active', true),
    db.from('brands').select('id', { count: 'exact', head: true }),
    db.from('guides').select('id', { count: 'exact', head: true }).eq('status', 'published'),
  ]);
  const withoutImages = await db.from('products').select('id, images:product_images(id)').eq('active', true);
  const missingImages = (withoutImages.data ?? []).filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- fila cruda de Supabase, sin tipos generados
    (p: any) => (p.images ?? []).length === 0,
  ).length;
  return {
    products: products.count ?? 0,
    activeProducts: activeProducts.count ?? 0,
    brands: brands.count ?? 0,
    guides: guides.count ?? 0,
    missingImages,
  };
}
