import { notFound, permanentRedirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  getAllActiveProductSlugs,
  getProductBySlug,
  getProductSlugRedirect,
  getRelatedProducts,
} from '@/lib/data/products';
import { safe } from '@/lib/data/safe';
import { storageUrl } from '@/lib/storage';
import { buildProductWhatsAppUrl } from '@/lib/whatsapp';
import { formatPricePerKg, formatUyu } from '@/lib/format';
import { deliverySummary } from '@/lib/delivery';
import { ProductCard } from '@/components/commerce/ProductCard';
import { WhatsAppCtaButton } from '@/components/commerce/WhatsAppCtaButton';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildProductJsonLd } from '@/lib/seo/jsonld';
import { buildMetadata, productDescription, productTitle } from '@/lib/seo/metadata';

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await safe(() => getAllActiveProductSlugs(), []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const images = product.images.map((img) => storageUrl(img.storage_path)).filter(Boolean) as string[];
  return buildMetadata({
    title: product.meta_title || productTitle(product.name, product.presentation, product.brand.name),
    description: product.meta_description || productDescription(product.name, product.short_description),
    path: `/producto/${product.slug}/`,
    image: images[0],
  });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    const currentSlug = await getProductSlugRedirect(slug);
    if (currentSlug) permanentRedirect(`/producto/${currentSlug}/`);
    notFound();
  }

  const related = await getRelatedProducts(product.category_id, product.id);
  const whatsappUrl = buildProductWhatsAppUrl(product);
  const pricePerKg = formatPricePerKg(product.price_uyu, product.net_weight_kg);
  const images = product.images.map((img) => ({
    url: storageUrl(img.storage_path),
    alt: img.alt_text || product.name,
  }));
  const primaryImage = images[0];

  const breadcrumbItems = [
    { name: 'Inicio', url: '/' },
    ...(product.category.parent
      ? [
          { name: product.category.parent.name, url: `/${product.category.parent.slug}/` },
          {
            name: product.category.name,
            url: `/${product.category.parent.slug}/${product.category.slug}/`,
          },
        ]
      : [{ name: product.category.name, url: `/${product.category.slug}/` }]),
    { name: product.name, url: `/producto/${product.slug}/` },
  ];

  return (
    <div className="pb-16">
      <Breadcrumbs items={breadcrumbItems} />
      <JsonLd
        data={buildProductJsonLd({
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          short_description: product.short_description,
          price_uyu: product.price_uyu,
          stock_status: product.stock_status,
          brandName: product.brand.name,
          images: images.map((i) => i.url).filter(Boolean) as string[],
        })}
      />

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-6 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-brand-warm-gray">
          {primaryImage?.url ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt}
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-contain p-6"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">Sin imagen</div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-green-dark">
            {product.brand.name}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-gray-900">{product.name}</h1>
          {product.presentation ? <p className="mt-1 text-gray-500">{product.presentation}</p> : null}
          {product.net_weight_kg ? (
            <p className="text-sm text-gray-500">{product.net_weight_kg} kg en total</p>
          ) : null}

          <p className="mt-4 text-3xl font-bold text-gray-900">{formatUyu(product.price_uyu)}</p>
          {pricePerKg ? <p className="text-sm text-gray-500">{pricePerKg}</p> : null}

          {product.stock_status === 'out_of_stock' ? (
            <p className="mt-2 text-sm font-semibold text-red-600">Sin stock</p>
          ) : (
            <p className="mt-2 text-sm font-semibold text-brand-green-dark">En stock</p>
          )}

          <div className="mt-6">
            <WhatsAppCtaButton href={whatsappUrl}>{`Consultar por ${product.name}`}</WhatsAppCtaButton>
          </div>

          <div className="mt-4 rounded-xl bg-brand-warm-gray p-4 text-sm text-gray-700">
            {deliverySummary}{' '}
            <Link href="/envios/" className="font-semibold text-brand-green-dark underline">
              Ver zonas y días
            </Link>
          </div>

          {product.short_description ? (
            <p className="mt-6 text-gray-700">{product.short_description}</p>
          ) : null}

          {product.benefits.length > 0 ? (
            <div className="mt-6">
              <h2 className="font-display text-lg font-bold text-gray-900">Beneficios</h2>
              <ul className="mt-2 list-inside list-disc space-y-1 text-gray-700">
                {product.benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {product.characteristics.length > 0 ? (
            <div className="mt-6">
              <h2 className="font-display text-lg font-bold text-gray-900">Características</h2>
              <ul className="mt-2 list-inside list-disc space-y-1 text-gray-700">
                {product.characteristics.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {product.long_description ? (
        <div className="mx-auto mt-10 max-w-6xl px-4">
          <h2 className="font-display text-xl font-bold text-gray-900">Descripción</h2>
          <div className="prose mt-3 max-w-3xl text-gray-700">{product.long_description}</div>
        </div>
      ) : null}

      {related.length > 0 ? (
        <div className="mx-auto mt-12 max-w-6xl px-4">
          <h2 className="font-display text-xl font-bold text-gray-900">Productos relacionados</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
