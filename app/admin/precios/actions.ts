'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabase } from '@/lib/supabase';
import {
  MAX_PRICE_CHANGE_PERCENT,
  PRICE_ROUNDING_STEPS,
  changePrice,
  parsePriceChangePercent,
} from '@/lib/pricing';
import { revalidateStorefront } from '@/lib/revalidate';

export interface PriceChange {
  id: number;
  /** Precio antes del cambio masivo. */
  from: number;
  /** Precio que dejó el cambio masivo. */
  to: number;
}

export interface PriceChangeState {
  error?: string;
  ok?: boolean;
  message?: string;
  /** Lo que se cambió, para poder deshacerlo desde la misma pantalla. */
  changes?: PriceChange[];
}

export interface UndoPriceChangeResult {
  error?: string;
  message?: string;
}

/** Guarda los precios agrupados por valor (una consulta por precio distinto); devuelve los ids que fallaron. */
async function updatePrices(prices: { id: number; price: number }[]): Promise<Set<number>> {
  const idsByPrice = new Map<number, number[]>();
  for (const { id, price } of prices) idsByPrice.set(price, [...(idsByPrice.get(price) ?? []), id]);

  const db = supabase();
  const failed = new Set<number>();
  await Promise.all(
    [...idsByPrice].map(async ([price, ids]) => {
      const { error } = await db.from('products').update({ price_uyu: price }).in('id', ids);
      if (error) ids.forEach((id) => failed.add(id));
    }),
  );
  return failed;
}

function revalidatePricePages() {
  revalidateStorefront();
  revalidatePath('/admin', 'layout');
}

function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

export async function applyPriceChangeAction(_prev: PriceChangeState, formData: FormData): Promise<PriceChangeState> {
  await requireAdmin();

  const percent = parsePriceChangePercent(formData.get('percent'));
  if (percent === null) {
    return {
      error: `Poné un porcentaje entre -${MAX_PRICE_CHANGE_PERCENT} y ${MAX_PRICE_CHANGE_PERCENT}, distinto de 0 (ej.: 8 para subir, -5 para bajar).`,
    };
  }
  const step = Number(formData.get('rounding'));
  if (!(PRICE_ROUNDING_STEPS as readonly number[]).includes(step)) return { error: 'Elegí cómo redondear los precios.' };

  const ids = [...new Set(formData.getAll('ids').map(Number))].filter((id) => Number.isInteger(id) && id > 0);
  if (ids.length === 0) return { error: 'No hay productos elegidos.' };

  // Se recalcula con los precios de la base, no con los que mostraba el navegador.
  const { data: rows, error } = await supabase().from('products').select('id, price_uyu').in('id', ids);
  if (error) return { error: `No se pudo leer los precios: ${error.message}` };

  const changes = (rows ?? [])
    .map((row) => ({ id: row.id, from: row.price_uyu, to: changePrice(row.price_uyu, percent, step) }))
    .filter((change) => change.to !== change.from);
  if (changes.length === 0) return { ok: true, message: 'Con ese porcentaje y ese redondeo no cambia ningún precio.' };

  const failed = await updatePrices(changes.map((change) => ({ id: change.id, price: change.to })));
  const applied = changes.filter((change) => !failed.has(change.id));
  if (applied.length > 0) revalidatePricePages();

  const summary = `${percent > 0 ? '+' : ''}${String(percent).replace('.', ',')}%`;
  if (failed.size > 0) {
    return {
      error: `Se actualizaron ${plural(applied.length, 'precio', 'precios')} (${summary}), pero ${plural(failed.size, 'no se pudo guardar', 'no se pudieron guardar')}. Revisá la lista y probá de nuevo con esos.`,
      changes: applied,
    };
  }
  return {
    ok: true,
    message: `Listo: ${plural(applied.length, 'precio actualizado', 'precios actualizados')} (${summary}). Ya se ven en el sitio.`,
    changes: applied,
  };
}

const undoSchema = z
  .array(
    z.object({
      id: z.number().int().positive(),
      from: z.number().int().min(0).max(10_000_000),
      to: z.number().int().min(0).max(10_000_000),
    }),
  )
  .min(1)
  .max(1000);

/** Vuelve al precio anterior los productos que todavía tienen el precio que dejó el cambio masivo. */
export async function undoPriceChangeAction(input: PriceChange[]): Promise<UndoPriceChangeResult> {
  await requireAdmin();
  const parsed = undoSchema.safeParse(input);
  if (!parsed.success) return { error: 'No hay nada para deshacer.' };
  const changes = parsed.data;

  const { data: rows, error } = await supabase()
    .from('products')
    .select('id, price_uyu')
    .in(
      'id',
      changes.map((change) => change.id),
    );
  if (error) return { error: `No se pudo leer los precios: ${error.message}` };

  // Si alguien editó un precio después del cambio masivo, ese se respeta.
  const current = new Map((rows ?? []).map((row) => [row.id, row.price_uyu]));
  const toRestore = changes.filter((change) => current.get(change.id) === change.to);
  const skipped = changes.length - toRestore.length;

  const failed = await updatePrices(toRestore.map((change) => ({ id: change.id, price: change.from })));
  const restored = toRestore.length - failed.size;
  if (restored > 0) revalidatePricePages();

  if (failed.size > 0) {
    return { error: `Se restauraron ${restored}, pero ${plural(failed.size, 'falló', 'fallaron')}. Probá de nuevo.` };
  }
  return {
    message:
      `Listo: ${plural(restored, 'producto volvió', 'productos volvieron')} al precio anterior.` +
      (skipped > 0 ? ` ${plural(skipped, 'no se tocó porque su precio', 'no se tocaron porque su precio')} cambió después.` : ''),
  };
}
