/**
 * Precios con descuento. Sin "server-only": el admin también lo usa para la vista previa del precio final.
 *
 * Hay dos descuentos posibles: el general (toda la tienda, en site_settings) y el propio de cada producto.
 * No se suman: se aplica el mayor de los dos.
 */

/** Tope que acepta el admin: evita que un error de tipeo deje un producto regalado. */
export const MAX_DISCOUNT_PERCENT = 90;

export interface Pricing {
  /** Precio de lista, el que se carga en el admin. */
  regular: number;
  /** Precio a pagar: igual a `regular` si no hay descuento. */
  final: number;
  /** Descuento aplicado, o 0 si no hay. */
  discountPercent: number;
}

/** Precio con un porcentaje de descuento, redondeado al peso. */
export function applyDiscount(price: number, percent: number): number {
  if (percent <= 0) return price;
  return Math.round((price * (100 - percent)) / 100);
}

export function buildPricing(regular: number, productPercent: number, sitePercent: number): Pricing {
  const discountPercent = Math.max(productPercent || 0, sitePercent || 0);
  return { regular, final: applyDiscount(regular, discountPercent), discountPercent };
}

export function isOnSale(pricing: Pricing): boolean {
  return pricing.final < pricing.regular;
}

/** Texto de la barra animada del inicio: el que se cargó en el admin o uno armado con el porcentaje. */
export function siteDiscountMessage(percent: number, customMessage: string): string {
  return customMessage.trim() || `${percent}% de descuento en todos los productos`;
}

// ---------------------------------------------------------------- cambio masivo de precios de lista

/** Tope del cambio masivo, para frenar errores de tipeo (50 en vez de 5). */
export const MAX_PRICE_CHANGE_PERCENT = 50;
export const PRICE_ROUNDING_STEPS = [1, 10, 50, 100] as const;

/** Precio de lista después de subirlo o bajarlo un porcentaje, redondeado al múltiplo de `step` más cercano. */
export function changePrice(price: number, percent: number, step: number): number {
  const raw = (price * (100 + percent)) / 100;
  return Math.max(0, Math.round(raw / step) * step);
}

/** "8", "+8 %", "-5", "7,5" → número; vacío, 0 o fuera de ±MAX_PRICE_CHANGE_PERCENT → null. */
export function parsePriceChangePercent(value: FormDataEntryValue | null): number | null {
  const cleaned = typeof value === 'string' ? value.replace(/[%\s+]/g, '').replace(',', '.') : '';
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n !== 0 && Math.abs(n) <= MAX_PRICE_CHANGE_PERCENT ? n : null;
}

/** "15", " 15 % " → 15; vacío → 0; cualquier otra cosa (decimales, fuera de rango) → null. */
export function parseDiscountPercent(value: FormDataEntryValue | null): number | null {
  const cleaned = typeof value === 'string' ? value.replace(/[%\s]/g, '') : '';
  if (cleaned === '') return 0;
  const n = Number(cleaned);
  return Number.isInteger(n) && n >= 0 && n <= MAX_DISCOUNT_PERCENT ? n : null;
}
