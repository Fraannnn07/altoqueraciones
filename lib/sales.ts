/**
 * Ventas del mostrador: cuentas, fechas y formatos. Sin "server-only": el formulario de venta lo usa para
 * la vista previa de los totales, y el servidor y el comprobante para los números finales.
 */

export const SALES_TIME_ZONE = 'America/Montevideo';

export const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'mercadopago', label: 'Mercado Pago' },
  { value: 'otro', label: 'Otro' },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value'];

export const PAYMENT_METHOD_VALUES = PAYMENT_METHODS.map((method) => method.value) as [PaymentMethod, ...PaymentMethod[]];

export function paymentLabel(value: string): string {
  return PAYMENT_METHODS.find((method) => method.value === value)?.label ?? value;
}

/** Topes del formulario, para frenar errores de tipeo (100 bolsas en vez de 1). */
export const MAX_SALE_LINES = 60;
export const MAX_LINE_QUANTITY = 999;
export const MAX_UNIT_PRICE = 1_000_000;

export interface SaleLine {
  /** null = concepto libre (envío, algo que no está en el catálogo). */
  productId: number | null;
  description: string;
  quantity: number;
  unitPrice: number;
  /** null = no se sabe cuánto costó: esa venta no entra en la ganancia. */
  unitCost: number | null;
}

export interface SaleTotals {
  subtotal: number;
  discount: number;
  total: number;
  /** Suma de los costos conocidos. */
  cost: number;
  /** Todas las líneas tienen costo. */
  costComplete: boolean;
  /** Total − costo, o null si falta algún costo. */
  profit: number | null;
}

/** Misma cuenta que hace save_sale en la base (ver la migración de ventas). */
export function saleTotals(lines: SaleLine[], discount: number): SaleTotals {
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const cost = lines.reduce((sum, line) => sum + (line.unitCost ?? 0) * line.quantity, 0);
  const costComplete = lines.length > 0 && lines.every((line) => line.unitCost !== null);
  const appliedDiscount = Math.min(Math.max(Math.round(discount) || 0, 0), subtotal);
  const total = subtotal - appliedDiscount;
  return { subtotal, discount: appliedDiscount, total, cost, costComplete, profit: costComplete ? total - cost : null };
}

/** Margen sobre lo vendido, en %, o null si no hay base para calcularlo. */
export function marginPercent(profit: number, revenue: number): number | null {
  return revenue > 0 ? Math.round((profit / revenue) * 100) : null;
}

/** 12 → "00012". */
export function formatSaleNumber(number: number): string {
  return String(number).padStart(5, '0');
}

export function receiptFileName(sale: { number: number }): string {
  return `Comprobante-AlToque-${formatSaleNumber(sale.number)}.pdf`;
}

/** Minúsculas, sin tildes y con un solo espacio: así se guarda y se busca `sales.search_text`. */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** "12.000", "$ 3200", "3,5" → entero en pesos; vacío → null; otra cosa → NaN. */
export function parsePesos(value: string): number | null {
  const cleaned = value.replace(/[$\s.]/g, '').replace(',', '.');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n) : NaN;
}

// ---------------------------------------------------------------- fechas en hora de Montevideo

const dateParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: SALES_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function partsOf(date: Date) {
  const parts = Object.fromEntries(dateParts.formatToParts(date).map((part) => [part.type, part.value]));
  return { day: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

/** Día de hoy en Montevideo, "2026-10-28". */
export function todayInMontevideo(now = new Date()): string {
  return partsOf(now).day;
}

/** Valor para un <input type="datetime-local"> en hora de Montevideo, "2026-10-28T14:30". */
export function toLocalInputValue(date: Date): string {
  const { day, time } = partsOf(date);
  return `${day}T${time}`;
}

export function isIsoDay(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function dayToUtc(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

function utcToDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(day: string, days: number): string {
  const date = dayToUtc(day);
  date.setUTCDate(date.getUTCDate() + days);
  return utcToDay(date);
}

/** Lunes de la semana de ese día (la semana de la caja va de lunes a domingo). */
export function weekStart(day: string): string {
  const weekday = dayToUtc(day).getUTCDay(); // 0 = domingo
  return addDays(day, -((weekday + 6) % 7));
}

export function monthStart(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

/** Primer día del mes siguiente a `month` ("2026-10" o "2026-10-15"). */
export function nextMonthStart(month: string): string {
  const date = dayToUtc(monthStart(month.length === 7 ? `${month}-01` : month));
  date.setUTCMonth(date.getUTCMonth() + 1);
  return utcToDay(date);
}

export function addMonths(month: string, months: number): string {
  const date = dayToUtc(`${month.slice(0, 7)}-01`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return utcToDay(date).slice(0, 7);
}

const dayLabelFormatter = new Intl.DateTimeFormat('es-UY', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});
const shortDayFormatter = new Intl.DateTimeFormat('es-UY', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const monthLabelFormatter = new Intl.DateTimeFormat('es-UY', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** "2026-10-28" → "mié, 28 oct". */
export function dayLabel(day: string): string {
  return dayLabelFormatter.format(dayToUtc(day));
}

/** "2026-10-27" → "27 oct – 2 nov". */
export function weekLabel(start: string): string {
  return `${shortDayFormatter.format(dayToUtc(start))} – ${shortDayFormatter.format(dayToUtc(addDays(start, 6)))}`;
}

/** "2026-10" → "Octubre de 2026". */
export function monthLabel(month: string): string {
  const label = monthLabelFormatter.format(dayToUtc(`${month.slice(0, 7)}-01`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export const saleDateFormatter = new Intl.DateTimeFormat('es-UY', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: SALES_TIME_ZONE,
});
