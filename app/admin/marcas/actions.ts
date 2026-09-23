'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { supabase } from '@/lib/supabase';
import { slugify } from '@/lib/slug';
import { uniqueSlug } from '@/lib/admin-slug';
import { revalidateStorefront } from '@/lib/revalidate';

export interface BrandFormState {
  error?: string;
  ok?: boolean;
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const s = typeof value === 'string' ? value.trim() : '';
  return s === '' ? null : s;
}

export async function saveBrandAction(_prev: BrandFormState, formData: FormData): Promise<BrandFormState> {
  await requireAdmin();

  const idRaw = String(formData.get('id') ?? '');
  const id = idRaw ? Number(idRaw) : null;
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const metaTitle = emptyToNull(formData.get('meta_title'));
  const metaDescription = emptyToNull(formData.get('meta_description'));
  const active = formData.get('active') === 'on';

  if (name.length < 2) return { error: 'Escribí el nombre de la marca.' };
  if (name.length > 80) return { error: 'El nombre es demasiado largo.' };
  if (description.length > 2000) return { error: 'La descripción es demasiado larga.' };
  if (metaTitle && metaTitle.length > 120) return { error: 'El título SEO admite hasta 120 caracteres.' };
  if (metaDescription && metaDescription.length > 200) return { error: 'La meta descripción admite hasta 200 caracteres.' };

  const row = { name, description, meta_title: metaTitle, meta_description: metaDescription, active };

  if (id === null) {
    const slug = await uniqueSlug('brands', slugify(name));
    const { error } = await supabase().from('brands').insert({ ...row, slug });
    if (error) return { error: `No se pudo crear la marca: ${error.message}` };
  } else {
    if (!Number.isInteger(id) || id <= 0) return { error: 'Marca inválida.' };
    const { error } = await supabase().from('brands').update(row).eq('id', id);
    if (error) return { error: `No se pudo guardar: ${error.message}` };
  }

  revalidateStorefront();
  revalidatePath('/admin/marcas');
  return { ok: true };
}
