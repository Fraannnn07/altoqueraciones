'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { supabase } from '@/lib/supabase';
import { MAX_DISCOUNT_PERCENT, parseDiscountPercent } from '@/lib/pricing';
import { revalidateStorefront } from '@/lib/revalidate';

export interface DiscountFormState {
  error?: string;
  ok?: boolean;
  message?: string;
}

const MESSAGE_MAX_LENGTH = 120;

function revalidateDiscountPages() {
  revalidateStorefront();
  revalidatePath('/admin', 'layout');
}

// ---------------------------------------------------------------- descuento general

export async function saveSiteDiscountAction(_prev: DiscountFormState, formData: FormData): Promise<DiscountFormState> {
  await requireAdmin();

  const active = formData.get('active') === 'on';
  const percent = parseDiscountPercent(formData.get('percent'));
  const message = String(formData.get('message') ?? '').trim();

  if (percent === null) return { error: `El descuento tiene que ser un número entero entre 0 y ${MAX_DISCOUNT_PERCENT}.` };
  if (active && percent === 0) return { error: 'Para activar el descuento general, poné un porcentaje mayor a 0.' };
  if (message.length > MESSAGE_MAX_LENGTH) {
    return { error: `El mensaje de la barra admite hasta ${MESSAGE_MAX_LENGTH} caracteres.` };
  }

  const { error } = await supabase().from('site_settings').upsert({
    id: 1,
    site_discount_active: active,
    site_discount_percent: percent,
    site_discount_message: message,
  });
  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidateDiscountPages();
  return {
    ok: true,
    message: active
      ? `Listo: ${percent}% de descuento en toda la página. Ya se ve en el sitio.`
      : 'Listo: el descuento general está apagado.',
  };
}

// ---------------------------------------------------------------- redondeo

export async function saveDiscountRoundingAction(
  _prev: DiscountFormState,
  formData: FormData,
): Promise<DiscountFormState> {
  await requireAdmin();
  const roundToTen = formData.get('round_to_ten') === 'on';

  const { error } = await supabase().from('site_settings').update({ discount_round_to_ten: roundToTen }).eq('id', 1);
  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidateDiscountPages();
  return {
    ok: true,
    message: roundToTen
      ? 'Listo: los precios con descuento se redondean a la decena.'
      : 'Listo: los precios con descuento se calculan al peso.',
  };
}

// ---------------------------------------------------------------- descuento por producto

/** Recibe un campo `discount_{id}` por producto y guarda solo los que cambiaron. */
export async function saveProductDiscountsAction(
  _prev: DiscountFormState,
  formData: FormData,
): Promise<DiscountFormState> {
  await requireAdmin();

  const requested = new Map<number, number>();
  for (const [key, value] of formData.entries()) {
    const match = /^discount_(\d+)$/.exec(key);
    if (!match) continue;
    const percent = parseDiscountPercent(value);
    if (percent === null) {
      return { error: `Revisá los descuentos: van de 0 a ${MAX_DISCOUNT_PERCENT}, en números enteros.` };
    }
    requested.set(Number(match[1]), percent);
  }
  if (requested.size === 0) return { error: 'No llegó ningún descuento para guardar.' };

  const db = supabase();
  const { data: current, error: readError } = await db
    .from('products')
    .select('id, discount_percent')
    .in('id', [...requested.keys()]);
  if (readError) return { error: `No se pudo leer los productos: ${readError.message}` };

  // Una actualización por porcentaje distinto, en vez de una por producto.
  const idsByPercent = new Map<number, number[]>();
  for (const row of current ?? []) {
    const next = requested.get(row.id);
    if (next === undefined || next === row.discount_percent) continue;
    idsByPercent.set(next, [...(idsByPercent.get(next) ?? []), row.id]);
  }
  if (idsByPercent.size === 0) return { ok: true, message: 'No había cambios para guardar.' };

  const results = await Promise.all(
    [...idsByPercent].map(([percent, ids]) =>
      db.from('products').update({ discount_percent: percent }).in('id', ids),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) return { error: `No se pudo guardar: ${failed.error.message}` };

  const changed = [...idsByPercent.values()].reduce((total, ids) => total + ids.length, 0);
  revalidateDiscountPages();
  return {
    ok: true,
    message: `Listo: ${changed} producto${changed === 1 ? '' : 's'} actualizado${changed === 1 ? '' : 's'}. Ya se ve en el sitio.`,
  };
}
