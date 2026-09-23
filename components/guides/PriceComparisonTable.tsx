import Link from 'next/link';
import { getAllActiveProducts } from '@/lib/data/products';
import { brandedProductName, formatUyu, pricePerKg } from '@/lib/format';

const pricePerKgFormatter = new Intl.NumberFormat('es-UY', {
  style: 'currency',
  currency: 'UYU',
  maximumFractionDigits: 1,
});

/** "Combo 22+10 kg · 32 kg en total"; si la presentación ya dice los kilos totales, no se repite. */
function detailLine(presentation: string, netWeightKg: number | null): string {
  if (!netWeightKg) return presentation;
  const total = `${netWeightKg} kg`;
  if (!presentation) return `${total} en total`;
  return presentation.includes(total) ? presentation : `${presentation} · ${total} en total`;
}

/**
 * Tabla de precio por kilo calculada en vivo desde el catálogo (misma fuente
 * de datos que /raciones-perros/), para que la Guía A nunca quede desactualizada
 * si cambian precios o se agregan alimentos. Tres columnas para que el precio
 * por kilo se vea completo también en celular.
 */
export async function PriceComparisonTable() {
  const products = await getAllActiveProducts();
  const withPriceKg = products
    .map((p) => ({ ...p, kgPrice: pricePerKg(p.price_uyu, p.net_weight_kg) }))
    .filter((p) => p.kgPrice !== null)
    .sort((a, b) => (a.kgPrice as number) - (b.kgPrice as number));

  if (withPriceKg.length === 0) {
    return (
      <p className="rounded-xl bg-brand-warm-gray p-4 text-sm text-gray-600">
        Por ahora no hay alimentos cargados para comparar. Mirá el{' '}
        <Link href="/raciones-perros/" className="underline">
          catálogo
        </Link>{' '}
        para ver los precios actuales.
      </p>
    );
  }

  return (
    <div className="not-prose overflow-hidden rounded-xl border border-black/5">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Comparación de precio por kilo de los alimentos del catálogo</caption>
        <thead className="bg-brand-warm-gray text-xs uppercase tracking-wide text-gray-600">
          <tr>
            <th className="px-3 py-3 font-semibold">Alimento</th>
            <th className="px-3 py-3 font-semibold">Precio</th>
            <th className="px-3 py-3 font-semibold">Por kilo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {withPriceKg.map((product) => (
            <tr key={product.id}>
              <td className="px-3 py-3 align-top">
                <Link
                  href={`/producto/${product.slug}/`}
                  className="font-semibold text-gray-900 hover:text-brand-green-dark hover:underline"
                >
                  {brandedProductName(product.brand.name, product.name)}
                </Link>
                <span className="mt-0.5 block text-xs text-gray-500">
                  {detailLine(product.presentation, product.net_weight_kg)}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-3 align-top text-gray-700">{formatUyu(product.price_uyu)}</td>
              <td className="whitespace-nowrap px-3 py-3 align-top font-semibold text-brand-green-dark">
                {pricePerKgFormatter.format(product.kgPrice as number)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
