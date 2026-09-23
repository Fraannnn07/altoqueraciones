import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminBrands, getCategoryOptions } from '@/lib/admin-data';
import { ProductForm } from '@/components/admin/ProductForm';

export default async function NewProductPage() {
  await requireAdmin();
  const [brands, categories] = await Promise.all([getAdminBrands(), getCategoryOptions()]);

  return (
    <div>
      <Link href="/admin/productos/" className="text-sm font-semibold text-gray-500 hover:text-brand-green-dark">
        ← Productos
      </Link>
      <h1 className="mt-2 font-display text-2xl font-bold text-gray-900">Agregar producto</h1>
      <div className="mt-6">
        <ProductForm
          initial={null}
          brands={brands.filter((b) => b.active).map((b) => ({ id: b.id, name: b.name }))}
          categories={categories}
        />
      </div>
    </div>
  );
}
