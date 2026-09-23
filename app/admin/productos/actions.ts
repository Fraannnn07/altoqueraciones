'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabase } from '@/lib/supabase';
import { slugify } from '@/lib/slug';
import { uniqueSlug } from '@/lib/admin-slug';
import { revalidateStorefront } from '@/lib/revalidate';

const BUCKET = 'product-images';
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };

export interface ProductFormState {
  error?: string;
  ok?: boolean;
  values?: Record<string, string>;
}

export interface ImageActionResult {
  error?: string;
  ok?: boolean;
}

// ---------------------------------------------------------------- helpers

function collectValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') values[key] = value;
  }
  return values;
}

function parsePrice(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = value.replace(/[$\s.]/g, '');
  return cleaned === '' ? undefined : Number(cleaned);
}

function parseDecimal(value: FormDataEntryValue | null): number | null | undefined {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim().replace(',', '.');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isNaN(n) ? undefined : n;
}

function parseLines(value: FormDataEntryValue | null): string[] {
  if (typeof value !== 'string') return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const s = typeof value === 'string' ? value.trim() : '';
  return s === '' ? null : s;
}

async function resolveBrandId(formData: FormData): Promise<{ brandId?: number; error?: string }> {
  const raw = String(formData.get('brand_id') ?? '');
  if (raw === 'new') {
    const name = String(formData.get('new_brand_name') ?? '').trim();
    if (name.length < 2) return { error: 'Escribí el nombre de la marca nueva.' };
    const slug = await uniqueSlug('brands', slugify(name));
    const { data, error } = await supabase()
      .from('brands')
      .insert({ name, slug, description: '' })
      .select('id')
      .single();
    if (error || !data) return { error: 'No se pudo crear la marca nueva.' };
    return { brandId: data.id };
  }
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return { error: 'Elegí una marca.' };
  return { brandId: id };
}

const productSchema = z.object({
  name: z.string().trim().min(2, 'Escribí el nombre del producto.').max(160, 'El nombre es demasiado largo.'),
  category_id: z
    .number({ error: 'Elegí una categoría.' })
    .int('Elegí una categoría.')
    .positive('Elegí una categoría.'),
  presentation: z.string().trim().max(80, 'La presentación es demasiado larga.'),
  net_weight_kg: z
    .number({ error: 'Los kilos totales no son un número válido.' })
    .positive('Los kilos totales tienen que ser mayores a 0.')
    .max(1000, 'Los kilos totales parecen demasiados.')
    .nullable(),
  price_uyu: z
    .number({ error: 'Escribí el precio (solo números).' })
    .int('El precio tiene que ser un número entero.')
    .min(0, 'El precio no puede ser negativo.')
    .max(10_000_000, 'El precio parece demasiado alto.'),
  short_description: z.string().trim().max(300, 'La descripción corta admite hasta 300 caracteres.'),
  long_description: z.string().trim().max(10_000, 'La descripción larga es demasiado extensa.'),
  benefits: z.array(z.string().max(200)).max(20, 'Máximo 20 beneficios.'),
  characteristics: z.array(z.string().max(200)).max(20, 'Máximo 20 características.'),
  stock_status: z.enum(['in_stock', 'out_of_stock']),
  sku: z.string().max(80).nullable(),
  meta_title: z.string().max(120, 'El título SEO admite hasta 120 caracteres.').nullable(),
  meta_description: z.string().max(200, 'La meta descripción admite hasta 200 caracteres.').nullable(),
  sort_order: z.number().int(),
  active: z.boolean(),
  featured: z.boolean(),
});

// ---------------------------------------------------------------- productos

export async function saveProductAction(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const values = collectValues(formData);

  const idRaw = String(formData.get('id') ?? '');
  const id = idRaw ? Number(idRaw) : null;
  if (idRaw && (!Number.isInteger(id) || (id as number) <= 0)) return { error: 'Producto inválido.', values };

  const sortRaw = String(formData.get('sort_order') ?? '').trim();
  const parsed = productSchema.safeParse({
    name: formData.get('name') ?? '',
    category_id: Number(formData.get('category_id') || NaN),
    presentation: formData.get('presentation') ?? '',
    net_weight_kg: parseDecimal(formData.get('net_weight_kg')),
    price_uyu: parsePrice(formData.get('price_uyu')),
    short_description: formData.get('short_description') ?? '',
    long_description: formData.get('long_description') ?? '',
    benefits: parseLines(formData.get('benefits')),
    characteristics: parseLines(formData.get('characteristics')),
    stock_status: formData.get('stock_status') ?? 'in_stock',
    sku: emptyToNull(formData.get('sku')),
    meta_title: emptyToNull(formData.get('meta_title')),
    meta_description: emptyToNull(formData.get('meta_description')),
    sort_order: sortRaw === '' ? 0 : Number(sortRaw),
    active: formData.get('active') === 'on',
    featured: formData.get('featured') === 'on',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisá los datos.', values };
  const data = parsed.data;

  const brand = await resolveBrandId(formData);
  if (brand.error || !brand.brandId) return { error: brand.error ?? 'Elegí una marca.', values };

  const row = { ...data, brand_id: brand.brandId };

  if (id === null) {
    const slug = await uniqueSlug('products', slugify(`${data.name} ${data.presentation}`));
    const { data: created, error } = await supabase()
      .from('products')
      .insert({ ...row, slug, published_at: new Date().toISOString() })
      .select('id')
      .single();
    if (error || !created) return { error: `No se pudo crear el producto: ${error?.message ?? 'error desconocido'}`, values };
    revalidateStorefront();
    redirect(`/admin/productos/${created.id}/?nuevo=1`);
  }

  const { data: existing } = await supabase()
    .from('products')
    .select('slug, previous_slugs')
    .eq('id', id)
    .maybeSingle();
  if (!existing) return { error: 'El producto ya no existe.', values };

  const requestedSlug = slugify(String(formData.get('slug') ?? '')) || existing.slug;
  let previousSlugs: string[] = existing.previous_slugs ?? [];
  if (requestedSlug !== existing.slug) {
    const { data: clash } = await supabase()
      .from('products')
      .select('id')
      .eq('slug', requestedSlug)
      .neq('id', id)
      .maybeSingle();
    if (clash) return { error: 'Ese slug ya lo usa otro producto.', values };
    previousSlugs = Array.from(new Set([...previousSlugs, existing.slug])).filter((s) => s !== requestedSlug);
  }

  const { error } = await supabase()
    .from('products')
    .update({ ...row, slug: requestedSlug, previous_slugs: previousSlugs })
    .eq('id', id);
  if (error) return { error: `No se pudo guardar: ${error.message}`, values };

  revalidateStorefront();
  revalidatePath('/admin/productos');
  return { ok: true, values };
}

export async function toggleProductActiveAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get('id'));
  const active = formData.get('active') === 'true';
  if (!Number.isInteger(id) || id <= 0) return;
  await supabase().from('products').update({ active }).eq('id', id);
  revalidateStorefront();
  revalidatePath('/admin/productos');
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get('id'));
  if (!Number.isInteger(id) || id <= 0) return;

  const db = supabase();
  const { data: images } = await db.from('product_images').select('storage_path').eq('product_id', id);
  const paths = (images ?? []).map((img) => img.storage_path).filter(Boolean);
  if (paths.length > 0) await db.storage.from(BUCKET).remove(paths);

  await db.from('products').delete().eq('id', id);
  revalidateStorefront();
  redirect('/admin/productos/');
}

// ---------------------------------------------------------------- imágenes

export async function uploadProductImageAction(formData: FormData): Promise<ImageActionResult> {
  await requireAdmin();

  const productId = Number(formData.get('productId'));
  const file = formData.get('file');
  if (!Number.isInteger(productId) || productId <= 0) return { error: 'Producto inválido.' };
  if (!(file instanceof File) || file.size === 0) return { error: 'No se recibió ninguna imagen.' };
  const extension = IMAGE_TYPES[file.type];
  if (!extension) return { error: 'Formato no soportado (usá JPG, PNG o WebP).' };
  if (file.size > MAX_IMAGE_BYTES) return { error: 'La imagen pesa más de 3 MB.' };

  const alt = String(formData.get('alt') ?? '').trim().slice(0, 200);
  const width = Number(formData.get('width'));
  const height = Number(formData.get('height'));

  const db = supabase();
  const { data: existing } = await db
    .from('product_images')
    .select('id, sort_order')
    .eq('product_id', productId);
  const nextOrder = (existing ?? []).reduce((max, img) => Math.max(max, img.sort_order), -1) + 1;

  const storagePath = `products/${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(storagePath, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    });
  if (uploadError) return { error: `No se pudo subir la imagen: ${uploadError.message}` };

  const { error: insertError } = await db.from('product_images').insert({
    product_id: productId,
    storage_path: storagePath,
    alt_text: alt,
    width: Number.isInteger(width) && width > 0 ? width : null,
    height: Number.isInteger(height) && height > 0 ? height : null,
    is_primary: (existing ?? []).length === 0,
    sort_order: nextOrder,
  });
  if (insertError) {
    await db.storage.from(BUCKET).remove([storagePath]);
    return { error: `No se pudo registrar la imagen: ${insertError.message}` };
  }

  revalidateStorefront();
  revalidatePath(`/admin/productos/${productId}`);
  return { ok: true };
}

export async function setPrimaryImageAction(productId: number, imageId: number): Promise<ImageActionResult> {
  await requireAdmin();
  const db = supabase();
  await db.from('product_images').update({ is_primary: false }).eq('product_id', productId);
  const { error } = await db
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)
    .eq('product_id', productId);
  if (error) return { error: error.message };
  revalidateStorefront();
  revalidatePath(`/admin/productos/${productId}`);
  return { ok: true };
}

export async function updateImageAltAction(productId: number, imageId: number, alt: string): Promise<ImageActionResult> {
  await requireAdmin();
  const { error } = await supabase()
    .from('product_images')
    .update({ alt_text: alt.trim().slice(0, 200) })
    .eq('id', imageId)
    .eq('product_id', productId);
  if (error) return { error: error.message };
  revalidateStorefront();
  revalidatePath(`/admin/productos/${productId}`);
  return { ok: true };
}

export async function deleteProductImageAction(productId: number, imageId: number): Promise<ImageActionResult> {
  await requireAdmin();
  const db = supabase();
  const { data: image } = await db
    .from('product_images')
    .select('storage_path, is_primary')
    .eq('id', imageId)
    .eq('product_id', productId)
    .maybeSingle();
  if (!image) return { error: 'La imagen ya no existe.' };

  if (image.storage_path) await db.storage.from(BUCKET).remove([image.storage_path]);
  await db.from('product_images').delete().eq('id', imageId);

  if (image.is_primary) {
    const { data: next } = await db
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .order('sort_order')
      .limit(1)
      .maybeSingle();
    if (next) await db.from('product_images').update({ is_primary: true }).eq('id', next.id);
  }

  revalidateStorefront();
  revalidatePath(`/admin/productos/${productId}`);
  return { ok: true };
}
