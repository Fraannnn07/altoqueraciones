import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { getSaleProducts } from '@/lib/admin-sales';
import { ProductCostsForm } from '@/components/admin/ProductCostsForm';
import { cardClass } from '@/components/admin/ui';

export default async function AdminProductCostsPage() {
  await requireAdmin();
  const products = await getSaleProducts();

  return (
    <div>
      <Link href="/admin/ventas/" className="text-sm font-semibold text-brand-green-dark hover:underline">
        ← Ventas
      </Link>
      <h1 className="mt-2 font-display text-2xl font-bold text-gray-900">Costos</h1>
      <p className="mt-1 max-w-3xl text-sm text-gray-600">
        Lo que te cuesta cada producto. Se usa para calcular la ganancia de las ventas y no se muestra en el sitio. Al
        cargar una venta nueva se usa este costo (y si lo cambiás en la venta, queda el nuevo). Cambiarlo acá no toca las
        ventas ya guardadas.
      </p>

      <section className={`${cardClass} mt-6`}>
        <ProductCostsForm
          products={products.map((product) => ({
            id: product.id,
            label: product.label,
            brandName: product.brandName,
            price: product.price,
            cost: product.cost,
            active: product.active,
          }))}
        />
      </section>
    </div>
  );
}
