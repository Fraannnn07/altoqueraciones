import Link from 'next/link';
import { getAllActiveProducts } from '@/lib/data/products';
import { brandedProductName, formatUyu, pricePerKg } from '@/lib/format';

const pricePerKgFormatter = new Intl.NumberFormat('es-UY', {
  style: 'currency',
  currency: 'UYU',
  maximumFractionDigits: 1,
});

/**
 * Tabla de precio por kilo calculada en vivo desde el catálogo (misma fuente
 * de datos que /raciones-perros/), para que la Guía A nunca quede desactualizada
 * si cambian precios o se agregan alimentos.
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
    <div className="not-prose overflow-x-auto rounded-xl border border-black/5">
      <table className="w-full text-left text-sm">
        <thead className="bg-brand-warm-gray text-xs uppercase tracking-wide text-gray-600">
          <tr>
            <th className="px-4 py-3">Alimento</th>
            <th className="px-4 py-3">Presentación</th>
            <th className="px-4 py-3">Precio</th>
            <th className="px-4 py-3">Kilos totales</th>
            <th className="px-4 py-3">Precio por kilo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {withPriceKg.map((product) => (
            <tr key={product.id}>
              <td className="px-4 py-3 font-semibold text-gray-900">
                <Link href={`/producto/${product.slug}/`} className="hover:text-brand-green-dark hover:underline">
                  {brandedProductName(product.brand.name, product.name)}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-600">{product.presentation}</td>
              <td className="px-4 py-3 text-gray-600">{formatUyu(product.price_uyu)}</td>
              <td className="px-4 py-3 text-gray-600">{product.net_weight_kg} kg</td>
              <td className="px-4 py-3 font-semibold text-brand-green-dark">
                {pricePerKgFormatter.format(product.kgPrice as number)} / kg
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
