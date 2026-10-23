import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getActiveRootCategories, getCategoryBySlug, getSubcategories } from '@/lib/data/categories';
import { getProductsByCategoryIds, type ProductCard as ProductCardType } from '@/lib/data/products';
import { safe } from '@/lib/data/safe';
import { ProductCard } from '@/components/commerce/ProductCard';
import { StorePromises } from '@/components/commerce/StorePromises';
import { WhatsAppCtaButton } from '@/components/commerce/WhatsAppCtaButton';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildFaqJsonLd } from '@/lib/seo/jsonld';
import { buildMetadata, categoryDescription, categoryTitle } from '@/lib/seo/metadata';
import { buildGeneralWhatsAppUrl } from '@/lib/whatsapp';

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  const categories = await safe(() => getActiveRootCategories(), []);
  return categories.map((category) => ({ category: category.slug }));
}

async function loadCategory(slug: string) {
  const category = await getCategoryBySlug(slug);
  if (!category) return null;
  const subcategories = await getSubcategories(category.id);
  const categoryIds = [category.id, ...subcategories.map((c) => c.id)];
  const products = await getProductsByCategoryIds(categoryIds);
  if (products.length === 0) return null;
  return { category, subcategories, products };
}

/** Marcas de la grilla, sin repetir y en orden alfabético, para enlazar a su página. */
function brandsOf(products: ProductCardType[]) {
  const bySlug = new Map(products.map((p) => [p.brand.slug, p.brand]));
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const data = await loadCategory(slug);
  if (!data) return {};
  const { category } = data;
  return buildMetadata({
    title: category.meta_title || categoryTitle(category.name),
    description: category.meta_description || categoryDescription(category.name),
    path: `/${category.slug}/`,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const data = await loadCategory(slug);
  if (!data) notFound();
  const { category, subcategories, products } = data;
  const brands = brandsOf(products);
  const whatsappUrl = buildGeneralWhatsAppUrl(`Hola, quiero hacer un pedido de ${category.name.toLowerCase()}.`);

  return (
    <div className="pb-16">
      <Breadcrumbs items={[{ name: 'Inicio', url: '/' }, { name: category.name, url: `/${category.slug}/` }]} />

      <div className="mx-auto max-w-6xl px-4 pt-6">
        <h1 className="font-display text-3xl font-bold text-gray-900">{category.name}</h1>
        {category.intro_html ? (
          <div
            className="mt-3 max-w-3xl text-gray-600 [&_a]:font-semibold [&_a]:text-brand-green-dark [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: category.intro_html }}
          />
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          <StorePromises />
          <WhatsAppCtaButton
            href={whatsappUrl}
            className="inline-flex items-center justify-center rounded-full border-2 border-brand-green-dark px-4 py-1.5 text-sm font-bold text-brand-green-dark transition hover:bg-brand-green-dark hover:text-white"
          >
            Pedir por WhatsApp
          </WhatsAppCtaButton>
        </div>

        {subcategories.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/${category.slug}/${sub.slug}/`}
                className="rounded-full border border-brand-green-dark/30 px-4 py-1.5 text-sm font-semibold text-brand-green-dark transition hover:bg-brand-green-light"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        ) : null}

        <h2 className="sr-only">Productos</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} eager={index < 2} />
          ))}
        </div>

        {brands.length > 1 ? (
          <section className="mt-12">
            <h2 className="font-display text-xl font-bold text-gray-900">Marcas</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {brands.map((brand) => (
                <Link
                  key={brand.slug}
                  href={`/marcas/${brand.slug}/`}
                  className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-sm font-semibold text-gray-700 transition hover:border-brand-green-dark/40 hover:text-brand-green-dark"
                >
                  {brand.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {category.faq?.length ? (
          <section className="mt-12">
            <h2 className="font-display text-xl font-bold text-gray-900">Preguntas frecuentes</h2>
            <dl className="mt-4 max-w-3xl space-y-4">
              {category.faq.map((item) => (
                <div key={item.question}>
                  <dt className="font-semibold text-gray-800">{item.question}</dt>
                  <dd className="mt-1 text-gray-600">{item.answer}</dd>
                </div>
              ))}
            </dl>
            <JsonLd data={buildFaqJsonLd(category.faq)} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
