import { Fragment } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getActiveBrandsWithProducts, getBrandBySlug, getBrandRootCategories } from '@/lib/data/brands';
import { getProductsByBrandId, type ProductCard as ProductCardType } from '@/lib/data/products';
import { safe } from '@/lib/data/safe';
import { formatUyu, pricePerKg } from '@/lib/format';
import { ProductCard } from '@/components/commerce/ProductCard';
import { StorePromises } from '@/components/commerce/StorePromises';
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
  const [products, categories] = await Promise.all([getProductsByBrandId(brand.id), getBrandRootCategories(brand.id)]);
  if (products.length === 0) return null;
  return { brand, products, categories };
}

/** Precio más bajo y precio por kilo más bajo de la marca (con el descuento vigente, como en las fichas). */
function priceFacts(products: ProductCardType[]) {
  const minPrice = Math.min(...products.map((p) => p.pricing.final));
  const perKg = products
    .map((p) => pricePerKg(p.pricing.final, p.net_weight_kg))
    .filter((value): value is number => value !== null);
  return { minPrice, minPerKg: perKg.length > 0 ? Math.min(...perKg) : null };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand: slug } = await params;
  const data = await loadBrand(slug);
  if (!data) return {};
  const { minPrice } = priceFacts(data.products);
  return buildMetadata({
    title: data.brand.meta_title || brandTitle(data.brand.name),
    description:
      data.brand.meta_description ||
      brandDescription(data.brand.name, {
        productCount: data.products.length,
        categoryNames: data.categories.map((c) => c.name),
        minPrice,
      }),
    path: `/marcas/${data.brand.slug}/`,
  });
}

export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: slug } = await params;
  const data = await loadBrand(slug);
  if (!data) notFound();
  const { brand, products, categories } = data;
  const { minPrice, minPerKg } = priceFacts(products);

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
        {/* Resumen con datos del catálogo: se actualiza solo cuando cambian productos o precios. */}
        <p className="mt-2 max-w-3xl text-gray-600">
          Tenemos {products.length} {products.length === 1 ? 'producto' : 'productos'} de {brand.name}
          {categories.length > 0 ? ' en ' : ''}
          {categories.map((category, index) => (
            <Fragment key={category.slug}>
              {index > 0 ? (index === categories.length - 1 ? ' y ' : ', ') : null}
              <Link href={`/${category.slug}/`} className="font-semibold text-brand-green-dark underline">
                {category.name.toLowerCase()}
              </Link>
            </Fragment>
          ))}
          , desde {formatUyu(minPrice)}
          {minPerKg ? ` (desde ${formatUyu(minPerKg)} el kilo)` : ''}.
        </p>

        <StorePromises className="mt-5" />

        <h2 className="sr-only">Productos</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} eager={index < 2} />
          ))}
        </div>
      </div>
    </div>
  );
}
