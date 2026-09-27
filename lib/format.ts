const currencyFormatter = new Intl.NumberFormat('es-UY', {
  style: 'currency',
  currency: 'UYU',
  maximumFractionDigits: 0,
});

const pricePerKgFormatter = new Intl.NumberFormat('es-UY', {
  style: 'currency',
  currency: 'UYU',
  maximumFractionDigits: 1,
});

export function formatUyu(value: number): string {
  return currencyFormatter.format(value);
}

/** Precio por kilo a partir del precio total y el peso neto, o null si no hay peso cargado. */
export function pricePerKg(priceUyu: number, netWeightKg: number | null | undefined): number | null {
  if (!netWeightKg || netWeightKg <= 0) return null;
  return priceUyu / netWeightKg;
}

export function formatPricePerKg(priceUyu: number, netWeightKg: number | null | undefined): string | null {
  const value = pricePerKg(priceUyu, netWeightKg);
  if (value === null) return null;
  return `${pricePerKgFormatter.format(value)} / kg`;
}

/** Marca + nombre, sin duplicar cuando el nombre del producto ya empieza con la marca (ej. "Lager"). */
export function brandedProductName(brandName: string, productName: string): string {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalize(productName).startsWith(normalize(brandName))) return productName;
  return `${brandName} ${productName}`;
}

/** true si el nombre ya trae los kilos de la presentación ("Lager 22kg" + "22kg"), para no repetirlos. */
export function nameIncludesPresentation(name: string, presentation: string) {
  const weight = presentation.toLowerCase().match(/\d+(?:[.,]\d+)?(?:\s*\+\s*\d+(?:[.,]\d+)?)?/)?.[0];
  if (!weight) return false;
  const compact = (s: string) => s.toLowerCase().replace(/\s+/g, '').replace(/,/g, '.');
  return compact(name).includes(compact(weight));
}
