import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getActiveRootCategories, getCategoryBySlug, getSubcategories } from '@/lib/data/categories';
import { getProductsByCategoryIds } from '@/lib/data/products';
import { safe } from '@/lib/data/safe';
import { ProductCard } from '@/components/commerce/ProductCard';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildFaqJsonLd } from '@/lib/seo/jsonld';
import { buildMetadata, categoryDescription, categoryTitle } from '@/lib/seo/metadata';

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  const roots = await safe(() => getActiveRootCategories(), []);
  const params: { category: string; subcategory: string }[] = [];
  for (const root of roots) {
    const subs = await safe(() => getSubcategories(root.id), []);
    for (const sub of subs) {
      params.push({ category: root.slug, subcategory: sub.slug });
    }
  }
  return params;
}

async function loadSubcategory(categorySlug: string, subcategorySlug: string) {
  const parent = await getCategoryBySlug(categorySlug);
  if (!parent) return null;
  const subcategory = await getCategoryBySlug(subcategorySlug, categorySlug);
  if (!subcategory) return null;
  const products = await getProductsByCategoryIds([subcategory.id]);
  if (products.length === 0) return null;
  return { parent, subcategory, products };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; subcategory: string }>;
}): Promise<Metadata> {
  const { category, subcategory } = await params;
  const data = await loadSubcategory(category, subcategory);
  if (!data) return {};
  const title = `${data.subcategory.name} de ${data.parent.name}`;
  return buildMetadata({
    title: data.subcategory.meta_title || categoryTitle(title),
    description: data.subcategory.meta_description || categoryDescription(title),
    path: `/${data.parent.slug}/${data.subcategory.slug}/`,
  });
}

export default async function SubcategoryPage({
  params,
}: {
  params: Promise<{ category: string; subcategory: string }>;
}) {
  const { category, subcategory } = await params;
  const data = await loadSubcategory(category, subcategory);
  if (!data) notFound();
  const { parent, subcategory: sub, products } = data;

  return (
    <div className="pb-16">
      <Breadcrumbs
        items={[
          { name: 'Inicio', url: '/' },
          { name: parent.name, url: `/${parent.slug}/` },
          { name: sub.name, url: `/${parent.slug}/${sub.slug}/` },
        ]}
      />

      <div className="mx-auto max-w-6xl px-4 pt-6">
        <h1 className="font-display text-3xl font-bold text-gray-900">
          {sub.name} de {parent.name}
        </h1>
        {sub.intro_html ? (
          <div
            className="mt-3 max-w-3xl text-gray-600"
            dangerouslySetInnerHTML={{ __html: sub.intro_html }}
          />
        ) : null}

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {sub.faq?.length ? (
          <section className="mt-12">
            <h2 className="font-display text-xl font-bold text-gray-900">Preguntas frecuentes</h2>
            <dl className="mt-4 space-y-4">
              {sub.faq.map((item) => (
                <div key={item.question}>
                  <dt className="font-semibold text-gray-800">{item.question}</dt>
                  <dd className="mt-1 text-gray-600">{item.answer}</dd>
                </div>
              ))}
            </dl>
            <JsonLd data={buildFaqJsonLd(sub.faq)} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
