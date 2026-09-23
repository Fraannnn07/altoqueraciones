import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getActiveBrandsWithProducts, getBrandBySlug } from '@/lib/data/brands';
import { getProductsByBrandId } from '@/lib/data/products';
import { safe } from '@/lib/data/safe';
import { ProductCard } from '@/components/commerce/ProductCard';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { buildMetadata, brandDescription, brandTitle } from '@/lib/seo/metadata';

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  const brands = await safe(() => getActiveBrandsWithProducts(), []);
  return brands.map((brand) => ({ brand: brand.slug }));
}

async function loadBrand(slug: string) {
  const brand = await getBrandBySlug(slug);
  if (!brand) return null;
  const products = await getProductsByBrandId(brand.id);
  if (products.length === 0) return null;
  return { brand, products };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand: slug } = await params;
  const data = await loadBrand(slug);
  if (!data) return {};
  return buildMetadata({
    title: data.brand.meta_title || brandTitle(data.brand.name),
    description: data.brand.meta_description || brandDescription(data.brand.name),
    path: `/marcas/${data.brand.slug}/`,
  });
}

export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: slug } = await params;
  const data = await loadBrand(slug);
  if (!data) notFound();
  const { brand, products } = data;

  return (
    <div className="pb-16">
      <Breadcrumbs
        items={[
          { name: 'Inicio', url: '/' },
          { name: 'Marcas', url: '/marcas/' },
          { name: brand.name, url: `/marcas/${brand.slug}/` },
        ]}
      />

      <div className="mx-auto max-w-6xl px-4 pt-6">
        <h1 className="font-display text-3xl font-bold text-gray-900">{brand.name} en Uruguay</h1>
        {brand.description ? <p className="mt-3 max-w-3xl text-gray-600">{brand.description}</p> : null}

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
