import { requireAdmin } from '@/lib/admin-auth';
import { getAdminProducts } from '@/lib/admin-data';
import { PriceChangeForm } from '@/components/admin/PriceChangeForm';
import { cardClass } from '@/components/admin/ui';

export default async function AdminPricesPage() {
  await requireAdmin();
  const products = await getAdminProducts();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-gray-900">Cambio masivo de precios</h1>
      <p className="mt-1 max-w-3xl text-sm text-gray-600">
        Sube o baja el precio de lista de varios productos a la vez. Filtrá por marca o buscá, destildá los que no
        querés tocar, revisá la vista previa y aplicá. Si hay descuentos, se calculan sobre el precio nuevo.
      </p>

      <section className={`${cardClass} mt-6`}>
        <PriceChangeForm
          products={products.map((product) => ({
            id: product.id,
            name: product.name,
            presentation: product.presentation,
            brandName: product.brandName,
            price_uyu: product.price_uyu,
            active: product.active,
          }))}
        />
      </section>
    </div>
  );
}
