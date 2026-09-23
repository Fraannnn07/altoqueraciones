import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminBrands, getAdminProduct, getCategoryOptions } from '@/lib/admin-data';
import { storageUrl } from '@/lib/storage';
import { ProductForm } from '@/components/admin/ProductForm';
import { ImageManager } from '@/components/admin/ImageManager';
import { ConfirmSubmitButton } from '@/components/admin/ConfirmSubmitButton';
import { cardClass, dangerButtonClass } from '@/components/admin/ui';
import { deleteProductAction } from '../actions';

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}) {
  await requireAdmin();
  const { id: idParam } = await params;
  const { nuevo } = await searchParams;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [product, brands, categories] = await Promise.all([
    getAdminProduct(id),
    getAdminBrands(),
    getCategoryOptions(),
  ]);
  if (!product) notFound();

  const images = product.images.map((image) => ({
    id: image.id,
    url: storageUrl(image.storage_path),
    alt_text: image.alt_text,
    is_primary: image.is_primary,
  }));
  const defaultAlt = [product.name, product.presentation].filter(Boolean).join(' ');

  return (
    <div>
      <Link href="/admin/productos/" className="text-sm font-semibold text-gray-500 hover:text-brand-green-dark">
        ← Productos
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-gray-900">{product.name}</h1>
        <a
          href={`/producto/${product.slug}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-brand-green-dark hover:underline"
        >
          Ver en el sitio ↗
        </a>
      </div>

      {nuevo ? (
        <p className="mt-4 rounded-xl bg-brand-green-light p-4 text-sm text-brand-green-dark">
          Producto creado. Ya está en el sitio; ahora podés cargarle las fotos acá abajo.
        </p>
      ) : null}

      <div className="mt-6 space-y-6">
        <ProductForm
          initial={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            brand_id: product.brand_id,
            category_id: product.category_id,
            presentation: product.presentation,
            net_weight_kg: product.net_weight_kg,
            price_uyu: product.price_uyu,
            short_description: product.short_description,
            long_description: product.long_description,
            benefits: product.benefits ?? [],
            characteristics: product.characteristics ?? [],
            stock_status: product.stock_status,
            sku: product.sku,
            meta_title: product.meta_title,
            meta_description: product.meta_description,
            sort_order: product.sort_order,
            active: product.active,
            featured: product.featured,
          }}
          brands={brands.map((b) => ({ id: b.id, name: b.name }))}
          categories={categories}
        />

        <ImageManager productId={product.id} defaultAlt={defaultAlt} images={images} />

        <section className={cardClass}>
          <h2 className="font-display text-lg font-bold text-gray-900">Zona peligrosa</h2>
          <p className="mt-1 text-sm text-gray-600">
            Borrar elimina el producto y sus fotos para siempre. Si solo querés sacarlo del sitio, desmarcá “Visible
            en el sitio” y guardá.
          </p>
          <form action={deleteProductAction} className="mt-4">
            <input type="hidden" name="id" value={product.id} />
            <ConfirmSubmitButton
              message={`¿Borrar "${product.name}" definitivamente? No se puede deshacer.`}
              className={dangerButtonClass}
            >
              Borrar producto
            </ConfirmSubmitButton>
          </form>
        </section>
      </div>
    </div>
  );
}
