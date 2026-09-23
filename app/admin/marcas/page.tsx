import { requireAdmin } from '@/lib/admin-auth';
import { getAdminBrands } from '@/lib/admin-data';
import { BrandForm } from '@/components/admin/BrandForm';
import { cardClass } from '@/components/admin/ui';

export default async function AdminBrandsPage() {
  await requireAdmin();
  const brands = await getAdminBrands();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-gray-900">Marcas</h1>

      <details className={`${cardClass} mt-6`}>
        <summary className="cursor-pointer text-sm font-bold text-brand-green-dark">+ Nueva marca</summary>
        <div className="mt-4">
          <BrandForm initial={null} />
        </div>
      </details>

      <ul className="mt-6 space-y-3">
        {brands.map((brand) => (
          <li key={brand.id}>
            <details className={cardClass}>
              <summary className="cursor-pointer text-sm font-semibold text-gray-900">
                {brand.name}{' '}
                <span className="font-normal text-gray-500">
                  — {brand.productCount} producto{brand.productCount === 1 ? '' : 's'}
                  {brand.active ? '' : ' · inactiva'}
                </span>
              </summary>
              <div className="mt-4">
                <BrandForm
                  initial={{
                    id: brand.id,
                    name: brand.name,
                    description: brand.description,
                    meta_title: brand.meta_title,
                    meta_description: brand.meta_description,
                    active: brand.active,
                  }}
                />
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
