import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminProducts } from '@/lib/admin-data';
import { formatUyu, formatPricePerKg } from '@/lib/format';
import { toggleProductActiveAction } from './actions';
import { cardClass, primaryButtonClass, secondaryButtonClass } from '@/components/admin/ui';

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await getAdminProducts();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-gray-900">Productos</h1>
        <Link href="/admin/productos/nuevo/" className={primaryButtonClass}>
          Agregar producto
        </Link>
      </div>

      {products.length === 0 ? (
        <p className={`${cardClass} mt-6 text-sm text-gray-600`}>Todavía no hay productos.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {products.map((product) => {
            const perKg = formatPricePerKg(product.price_uyu, product.net_weight_kg);
            return (
              <li key={product.id} className={`${cardClass} flex flex-wrap items-center justify-between gap-3`}>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">
                    {product.name} <span className="font-normal text-gray-500">— {product.presentation || 'sin presentación'}</span>
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {product.brandName} · {product.categoryName} · {formatUyu(product.price_uyu)}
                    {perKg ? ` (${perKg})` : ''}
                    {product.net_weight_kg ? ` · ${product.net_weight_kg} kg` : ' · sin kilos cargados'}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-2 text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold ${
                        product.active ? 'bg-brand-green-light text-brand-green-dark' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {product.active ? 'Visible' : 'Oculto'}
                    </span>
                    {product.stock_status === 'out_of_stock' ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 font-semibold text-red-700">Sin stock</span>
                    ) : null}
                    {product.featured ? (
                      <span className="rounded-full bg-brand-orange-light px-2 py-0.5 font-semibold text-brand-orange-dark">
                        Destacado
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold ${
                        product.imageCount > 0 ? 'bg-gray-100 text-gray-600' : 'bg-brand-orange-light text-brand-orange-dark'
                      }`}
                    >
                      {product.imageCount > 0 ? `${product.imageCount} foto${product.imageCount === 1 ? '' : 's'}` : 'Sin fotos'}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/producto/${product.slug}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={secondaryButtonClass}
                  >
                    Ver
                  </a>
                  <form action={toggleProductActiveAction}>
                    <input type="hidden" name="id" value={product.id} />
                    <input type="hidden" name="active" value={product.active ? 'false' : 'true'} />
                    <button type="submit" className={secondaryButtonClass}>
                      {product.active ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </form>
                  <Link href={`/admin/productos/${product.id}/`} className={primaryButtonClass}>
                    Editar
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
