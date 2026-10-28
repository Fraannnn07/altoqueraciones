import 'server-only';
import { supabase } from '@/lib/supabase';
import { getPricingRules } from '@/lib/data/site-settings';
import { productFullName } from '@/lib/format';
import { buildPricing } from '@/lib/pricing';
import { normalizeSearchText } from '@/lib/sales';

export interface SaleItem {
  id: number;
  product_id: number | null;
  description: string;
  quantity: number;
  unit_price_uyu: number;
  unit_cost_uyu: number | null;
  line_total_uyu: number;
  sort_order: number;
}

export interface Sale {
  id: number;
  number: number;
  sold_at: string;
  sold_on: string;
  customer_name: string;
  customer_phone: string;
  payment_method: string;
  notes: string;
  subtotal_uyu: number;
  discount_uyu: number;
  total_uyu: number;
  cost_uyu: number;
  cost_complete: boolean;
  voided: boolean;
  created_at: string;
  updated_at: string;
  items: SaleItem[];
}

export interface SaleListItem {
  id: number;
  number: number;
  sold_at: string;
  customer_name: string;
  customer_phone: string;
  payment_method: string;
  total_uyu: number;
  cost_uyu: number;
  cost_complete: boolean;
  voided: boolean;
  /** "Lager 22kg" o "Lager 22kg y 2 más". */
  itemsSummary: string;
}

const LIST_SELECT =
  'id, number, sold_at, customer_name, customer_phone, payment_method, total_uyu, cost_uyu, cost_complete, voided, items:sale_items(description, quantity, sort_order)';

/* eslint-disable @typescript-eslint/no-explicit-any -- filas crudas de Supabase, sin tipos generados */
function toListItem(row: any): SaleListItem {
  const items = ((row.items ?? []) as { description: string; quantity: number; sort_order: number }[]).sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const first = items[0] ? `${items[0].quantity > 1 ? `${items[0].quantity} × ` : ''}${items[0].description}` : '';
  return {
    id: row.id,
    number: row.number,
    sold_at: row.sold_at,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    payment_method: row.payment_method,
    total_uyu: row.total_uyu,
    cost_uyu: row.cost_uyu,
    cost_complete: row.cost_complete,
    voided: row.voided,
    itemsSummary: items.length > 1 ? `${first} y ${items.length - 1} más` : first,
  };
}

export async function getSale(id: number): Promise<Sale | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const { data } = await supabase().from('sales').select('*, items:sale_items(*)').eq('id', id).maybeSingle();
  if (!data) return null;
  const raw = data as any;
  const items = ((raw.items ?? []) as SaleItem[]).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  return { ...raw, items } as Sale;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function getRecentSales(limit = 30): Promise<SaleListItem[]> {
  const { data, error } = await supabase()
    .from('sales')
    .select(LIST_SELECT)
    .order('sold_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(toListItem);
}

export interface SaleSearch {
  q: string;
  /** Días en hora de Montevideo, "2026-10-01"; '' = sin límite. */
  from: string;
  to: string;
  payment: string;
}

/** Tope de resultados de una búsqueda: con más, conviene acotar las fechas. */
export const SEARCH_LIMIT = 2000;

/** Ventas que coinciden con todas las palabras (cliente, celular, producto, nota o número) y los filtros. */
export async function searchSales(search: SaleSearch): Promise<{ sales: SaleListItem[]; truncated: boolean }> {
  const words = normalizeSearchText(search.q).split(' ').filter(Boolean).slice(0, 8);
  const sales: SaleListItem[] = [];
  const pageSize = 1000; // máximo que devuelve Supabase por consulta

  for (let offset = 0; offset < SEARCH_LIMIT; offset += pageSize) {
    let query = supabase()
      .from('sales')
      .select(LIST_SELECT)
      .order('sold_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, Math.min(offset + pageSize, SEARCH_LIMIT) - 1);
    // Un número solo puede ser el del comprobante o parte de un celular / producto.
    if (words.length === 1 && /^\d{1,6}$/.test(words[0])) {
      query = query.or(`number.eq.${Number(words[0])},search_text.ilike.%${words[0]}%`);
    } else {
      for (const word of words) query = query.ilike('search_text', `%${word}%`);
    }
    if (search.from) query = query.gte('sold_on', search.from);
    if (search.to) query = query.lte('sold_on', search.to);
    if (search.payment) query = query.eq('payment_method', search.payment);

    const { data, error } = await query;
    if (error) throw error;
    sales.push(...(data ?? []).map(toListItem));
    if ((data ?? []).length < pageSize) return { sales, truncated: false };
  }
  return { sales, truncated: true };
}

// ---------------------------------------------------------------- caja

export interface DailyTotals {
  day: string;
  sales_count: number;
  total_uyu: number;
  profit_uyu: number;
  total_with_cost_uyu: number;
  sales_without_cost: number;
}

/** Todas las filas de una vista de caja entre dos días (Supabase devuelve hasta 1000 por consulta). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- filas crudas de Supabase, sin tipos generados
async function fetchDays(view: 'sales_daily' | 'sales_daily_payments', from: string, to: string): Promise<any[]> {
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    let query = supabase().from(view).select('*').gte('day', from).lte('day', to).order('day');
    // Orden único, para que las páginas no se pisen.
    if (view === 'sales_daily_payments') query = query.order('payment_method');
    const { data, error } = await query.range(offset, offset + pageSize - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data ?? []).length < pageSize) return rows;
  }
}

/** Totales por día entre dos días (incluidos), de más viejo a más nuevo. Solo los días con ventas. */
export async function getDailyTotals(from: string, to: string): Promise<DailyTotals[]> {
  return (await fetchDays('sales_daily', from, to)).map((row) => ({
    day: row.day,
    sales_count: Number(row.sales_count),
    total_uyu: Number(row.total_uyu),
    profit_uyu: Number(row.profit_uyu),
    total_with_cost_uyu: Number(row.total_with_cost_uyu),
    sales_without_cost: Number(row.sales_without_cost),
  }));
}

export interface DailyPaymentTotals {
  day: string;
  payment_method: string;
  sales_count: number;
  total_uyu: number;
}

export async function getDailyPaymentTotals(from: string, to: string): Promise<DailyPaymentTotals[]> {
  return (await fetchDays('sales_daily_payments', from, to)).map((row) => ({
    day: row.day,
    payment_method: row.payment_method,
    sales_count: Number(row.sales_count),
    total_uyu: Number(row.total_uyu),
  }));
}

export interface PeriodTotals {
  sales: number;
  total: number;
  /** Ganancia de las ventas con todos los costos cargados. */
  profit: number;
  /** Lo vendido en esas ventas (base del margen). */
  totalWithCost: number;
  salesWithoutCost: number;
}

export const EMPTY_PERIOD: PeriodTotals = { sales: 0, total: 0, profit: 0, totalWithCost: 0, salesWithoutCost: 0 };

export function sumDays(days: DailyTotals[]): PeriodTotals {
  return days.reduce(
    (acc, day) => ({
      sales: acc.sales + day.sales_count,
      total: acc.total + day.total_uyu,
      profit: acc.profit + day.profit_uyu,
      totalWithCost: acc.totalWithCost + day.total_with_cost_uyu,
      salesWithoutCost: acc.salesWithoutCost + day.sales_without_cost,
    }),
    EMPTY_PERIOD,
  );
}

/** Agrupa los días por la clave que devuelve `keyOf` (semana, mes), en el orden en que aparecen. */
export function groupDays(days: DailyTotals[], keyOf: (day: string) => string): Map<string, PeriodTotals> {
  const groups = new Map<string, DailyTotals[]>();
  for (const day of days) {
    const key = keyOf(day.day);
    groups.set(key, [...(groups.get(key) ?? []), day]);
  }
  return new Map([...groups].map(([key, group]) => [key, sumDays(group)]));
}

/** Total por medio de pago, de mayor a menor. */
export function sumPayments(rows: DailyPaymentTotals[]): { method: string; sales: number; total: number }[] {
  const byMethod = new Map<string, { sales: number; total: number }>();
  for (const row of rows) {
    const current = byMethod.get(row.payment_method) ?? { sales: 0, total: 0 };
    byMethod.set(row.payment_method, { sales: current.sales + row.sales_count, total: current.total + row.total_uyu });
  }
  return [...byMethod].map(([method, totals]) => ({ method, ...totals })).sort((a, b) => b.total - a.total);
}

// ---------------------------------------------------------------- productos y costos

export interface SaleProductOption {
  id: number;
  /** Marca + nombre + presentación, como sale en el comprobante. */
  label: string;
  brandName: string;
  /** Precio de hoy en el sitio, con el descuento vigente. */
  price: number;
  cost: number | null;
  active: boolean;
  inStock: boolean;
}

export async function getProductCosts(): Promise<Map<number, number>> {
  const { data, error } = await supabase().from('product_costs').select('product_id, cost_uyu').limit(5000);
  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.product_id, row.cost_uyu]));
}

/** Productos para el formulario de venta: los activos primero, después los ocultos. */
export async function getSaleProducts(): Promise<SaleProductOption[]> {
  const [{ data, error }, rules, costs] = await Promise.all([
    supabase()
      .from('products')
      .select('id, name, presentation, price_uyu, discount_percent, active, stock_status, brand:brands(name)')
      .order('sort_order')
      .order('id'),
    getPricingRules(),
    getProductCosts(),
  ]);
  if (error) throw error;
  /* eslint-disable @typescript-eslint/no-explicit-any -- filas crudas de Supabase, sin tipos generados */
  return (data ?? [])
    .map((row: any) => {
      const brandName = row.brand?.name ?? '';
      return {
        id: row.id,
        label: brandName ? productFullName(brandName, row.name, row.presentation) : row.name,
        brandName,
        price: buildPricing(row.price_uyu, row.discount_percent, rules).final,
        cost: costs.get(row.id) ?? null,
        active: row.active,
        inStock: row.stock_status === 'in_stock',
      };
    })
    .sort((a, b) => Number(b.active) - Number(a.active));
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
