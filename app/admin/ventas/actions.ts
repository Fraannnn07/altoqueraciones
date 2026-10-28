'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { normalizarTelefono } from '@/lib/fidelidad/db';
import {
  MAX_LINE_QUANTITY,
  MAX_SALE_LINES,
  MAX_UNIT_PRICE,
  PAYMENT_METHOD_VALUES,
  normalizeSearchText,
  paymentLabel,
  parsePesos,
} from '@/lib/sales';
import { supabase } from '@/lib/supabase';

function revalidateSalesAdmin() {
  revalidatePath('/admin', 'layout');
}

function cleanText(value: FormDataEntryValue | null): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

const linesSchema = z
  .array(
    z.object({
      productId: z.number().int().positive().nullable(),
      description: z.string().trim().min(1).max(160),
      quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
      unitPrice: z.number().int().min(0).max(MAX_UNIT_PRICE),
      unitCost: z.number().int().min(0).max(MAX_UNIT_PRICE).nullable(),
    }),
  )
  .min(1)
  .max(MAX_SALE_LINES);

function parseLines(value: FormDataEntryValue | null) {
  try {
    return linesSchema.safeParse(JSON.parse(String(value ?? '')));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- guardar venta

export interface SaleFormState {
  error?: string;
}

export async function saveSaleAction(_prev: SaleFormState, formData: FormData): Promise<SaleFormState> {
  await requireAdmin();

  const rawId = String(formData.get('id') ?? '');
  const id = rawId ? Number(rawId) : null;
  if (id !== null && (!Number.isInteger(id) || id <= 0)) return { error: 'Venta inválida.' };

  const soldAt = String(formData.get('sold_at') ?? '');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(soldAt) || Number.isNaN(Date.parse(`${soldAt}:00Z`))) {
    return { error: 'Revisá la fecha y la hora de la venta.' };
  }

  const customerName = cleanText(formData.get('customer_name'));
  if (customerName.length > 80) return { error: 'El nombre del cliente admite hasta 80 caracteres.' };
  const rawPhone = cleanText(formData.get('customer_phone'));
  const customerPhone = rawPhone ? normalizarTelefono(rawPhone) : '';
  if (customerPhone === null) return { error: 'Revisá el celular: tiene que ser tipo 099 123 456 (o dejalo vacío).' };

  const paymentMethod = z.enum(PAYMENT_METHOD_VALUES).safeParse(formData.get('payment_method'));
  if (!paymentMethod.success) return { error: 'Elegí el medio de pago.' };

  const notes = String(formData.get('notes') ?? '').trim();
  if (notes.length > 300) return { error: 'La nota admite hasta 300 caracteres.' };

  const discount = parsePesos(String(formData.get('discount_uyu') ?? ''));
  if (discount !== null && (Number.isNaN(discount) || discount < 0)) return { error: 'Revisá el descuento.' };

  const parsed = parseLines(formData.get('lines'));
  if (!parsed?.success) return { error: 'Revisá los productos: cada línea necesita descripción, cantidad y precio.' };
  const lines = parsed.data;

  const searchText = normalizeSearchText(
    [customerName, customerPhone, ...lines.map((line) => line.description), notes, paymentLabel(paymentMethod.data)].join(
      ' ',
    ),
  );

  const { data: savedId, error } = await supabase().rpc('save_sale', {
    p_id: id,
    p_sale: {
      sold_at: soldAt,
      customer_name: customerName,
      customer_phone: customerPhone,
      payment_method: paymentMethod.data,
      notes,
      discount_uyu: discount ?? 0,
      search_text: searchText,
    },
    p_items: lines.map((line) => ({
      product_id: line.productId,
      description: line.description,
      quantity: line.quantity,
      unit_price_uyu: line.unitPrice,
      unit_cost_uyu: line.unitCost,
    })),
  });
  if (error || typeof savedId !== 'number') {
    console.error('[ventas] guardar', error);
    return { error: 'No se pudo guardar la venta. Probá de nuevo.' };
  }

  // En una venta nueva, el costo que se cargó queda como costo del producto para la próxima.
  if (id === null) {
    const costs = new Map<number, number>();
    for (const line of lines) if (line.productId !== null && line.unitCost !== null) costs.set(line.productId, line.unitCost);
    if (costs.size > 0) {
      const { error: costError } = await supabase()
        .from('product_costs')
        .upsert([...costs].map(([product_id, cost_uyu]) => ({ product_id, cost_uyu })));
      if (costError) console.error('[ventas] costos', costError);
    }
  }

  revalidateSalesAdmin();
  redirect(`/admin/ventas/${savedId}/${id === null ? '?nueva=1' : ''}`);
}

// ---------------------------------------------------------------- anular / borrar

function saleIdFrom(formData: FormData): number | null {
  const id = Number(formData.get('id'));
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function setSaleVoidedAction(formData: FormData) {
  await requireAdmin();
  const id = saleIdFrom(formData);
  if (id === null) return;
  const { error } = await supabase()
    .from('sales')
    .update({ voided: formData.get('voided') === 'true' })
    .eq('id', id);
  if (error) console.error('[ventas] anular', error);
  revalidateSalesAdmin();
}

export async function deleteSaleAction(formData: FormData) {
  await requireAdmin();
  const id = saleIdFrom(formData);
  if (id !== null) {
    const { error } = await supabase().from('sales').delete().eq('id', id);
    if (error) console.error('[ventas] borrar', error);
  }
  revalidateSalesAdmin();
  redirect('/admin/ventas/');
}

// ---------------------------------------------------------------- costos de los productos

export interface CostsFormState {
  error?: string;
  message?: string;
}

const costChangesSchema = z
  .array(z.object({ id: z.number().int().positive(), cost: z.number().int().min(0).max(MAX_UNIT_PRICE).nullable() }))
  .min(1)
  .max(2000);

export async function saveProductCostsAction(_prev: CostsFormState, formData: FormData): Promise<CostsFormState> {
  await requireAdmin();
  let parsed;
  try {
    parsed = costChangesSchema.safeParse(JSON.parse(String(formData.get('changes') ?? '')));
  } catch {
    parsed = null;
  }
  if (!parsed?.success) return { error: 'No hay costos cambiados para guardar.' };

  const toSave = parsed.data.filter((change) => change.cost !== null);
  const toClear = parsed.data.filter((change) => change.cost === null).map((change) => change.id);
  const db = supabase();
  const [saved, cleared] = await Promise.all([
    toSave.length > 0
      ? db.from('product_costs').upsert(toSave.map((change) => ({ product_id: change.id, cost_uyu: change.cost })))
      : null,
    toClear.length > 0 ? db.from('product_costs').delete().in('product_id', toClear) : null,
  ]);
  if (saved?.error || cleared?.error) {
    console.error('[ventas] costos', saved?.error ?? cleared?.error);
    return { error: 'No se pudieron guardar los costos. Probá de nuevo.' };
  }

  revalidateSalesAdmin();
  const n = parsed.data.length;
  return { message: `Listo: ${n} ${n === 1 ? 'costo guardado' : 'costos guardados'}.` };
}
