import { requireAdmin } from '@/lib/admin-auth';
import { getAdminProducts } from '@/lib/admin-data';
import { getSiteDiscount } from '@/lib/data/site-settings';
import { SiteDiscountForm } from '@/components/admin/SiteDiscountForm';
import { ProductDiscountsForm } from '@/components/admin/ProductDiscountsForm';
import { cardClass } from '@/components/admin/ui';

export default async function AdminDiscountsPage() {
  await requireAdmin();
  const [siteDiscount, products] = await Promise.all([getSiteDiscount(), getAdminProducts()]);
  const sitePercent = siteDiscount.active ? siteDiscount.percent : 0;
  const discountedCount = products.filter((product) => product.discount_percent > 0).length;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-gray-900">Descuentos</h1>
      <p className="mt-1 max-w-3xl text-sm text-gray-600">
        Con descuento, el sitio muestra el precio anterior más chico y tachado, y el precio nuevo resaltado. Los
        descuentos no se suman: si un producto tiene descuento propio y también hay descuento general, se aplica el
        mayor.
      </p>

      <section className={`${cardClass} mt-6`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-gray-900">Descuento general</h2>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              sitePercent > 0 ? 'bg-brand-sale text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {sitePercent > 0 ? `Activo: ${sitePercent}%` : 'Apagado'}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Se aplica a todos los productos. Mientras esté activo, en el inicio aparece una barra animada arriba de todo
          con el mensaje.
        </p>
        <div className="mt-4">
          <SiteDiscountForm initial={siteDiscount} />
        </div>
      </section>

      <section className={`${cardClass} mt-6`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-gray-900">Descuento por producto</h2>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              discountedCount > 0 ? 'bg-brand-sale text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {discountedCount} con descuento
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Un producto con descuento propio pasa solo a los destacados del inicio (aparece primero) y lleva la
          etiqueta con el porcentaje sobre la foto. Al sacarle el descuento vuelve a como estaba. Dejá 0 para no
          aplicar descuento.
        </p>
        <div className="mt-4">
          <ProductDiscountsForm
            sitePercent={sitePercent}
            products={products.map((product) => ({
              id: product.id,
              name: product.name,
              presentation: product.presentation,
              brandName: product.brandName,
              price_uyu: product.price_uyu,
              discount_percent: product.discount_percent,
              active: product.active,
            }))}
          />
        </div>
      </section>
    </div>
  );
}
