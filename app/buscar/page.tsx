import Link from 'next/link';
import type { Metadata } from 'next';
import { getSearchableProducts } from '@/lib/data/products';
import { getPublishedGuides } from '@/lib/data/guides';
import { getActiveBrandsWithProducts } from '@/lib/data/brands';
import { safe } from '@/lib/data/safe';
import { parseSearchQuery, searchItems } from '@/lib/search';
import { ProductCard } from '@/components/commerce/ProductCard';
import { WhatsAppCtaButton } from '@/components/commerce/WhatsAppCtaButton';
import { SearchForm } from '@/components/search/SearchForm';
import { buildGeneralWhatsAppUrl } from '@/lib/whatsapp';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site-config';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const q = parseSearchQuery((await searchParams).q);
  return {
    ...buildMetadata({
      title: q ? `Resultados para “${q}” | ${siteConfig.name}` : `Buscar productos | ${siteConfig.name}`,
      description: `Buscá raciones para perros y gatos por marca, tipo o kilos en ${siteConfig.name}.`,
      path: '/buscar/',
    }),
    // Los resultados de búsqueda no se indexan (serían páginas casi repetidas), pero sus links sí se siguen.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const q = parseSearchQuery((await searchParams).q);

  const [products, guides] = q
    ? await Promise.all([
        getSearchableProducts().then((items) =>
          searchItems(items, q, (product) => ({
            primary: [product.brand.name, product.name, product.presentation],
            secondary: product.categoryNames,
          })),
        ),
        safe(() => getPublishedGuides(), []).then((items) =>
          searchItems(items, q, (guide) => ({ primary: [guide.title] })),
        ),
      ])
    : [[], []];

  const noProducts = q !== '' && products.length === 0;
  // Sin búsqueda o sin resultados, las marcas dan un camino para seguir.
  const brands = !q || noProducts ? await safe(() => getActiveBrandsWithProducts(), []) : [];

  return (
    <div className="pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-8">
        <h1 className="break-words font-display text-3xl font-bold text-gray-900">
          {q ? `Resultados para “${q}”` : 'Buscar productos'}
        </h1>
        {!q ? (
          <p className="mt-2 max-w-2xl text-gray-600">
            Buscá por marca, tipo de alimento o kilos. Por ejemplo: “Pro Plan gato” o “cachorro 15kg”.
          </p>
        ) : null}

        {/* key: si se busca de nuevo desde el header, el campo muestra la búsqueda nueva. */}
        <SearchForm key={q} defaultValue={q} autoFocus={!q} className="mt-5 max-w-xl" />

        {products.length > 0 ? (
          <>
            <p className="mt-6 text-sm text-gray-600">
              {products.length} {products.length === 1 ? 'producto' : 'productos'}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : null}

        {noProducts ? (
          <div className="mt-8 max-w-2xl rounded-2xl bg-white p-6 shadow-sm">
            <p className="font-display text-lg font-semibold text-gray-900">
              No encontramos productos para “{q}”.
            </p>
            <p className="mt-2 text-gray-600">
              Probá con otra palabra, por ejemplo solo la marca o “cachorro”. Si buscás algo que no está en la
              web, escribinos por WhatsApp y te ayudamos.
            </p>
            <WhatsAppCtaButton
              href={buildGeneralWhatsAppUrl(`Hola, busqué "${q}" en la web y no lo encontré. ¿Me pueden ayudar?`)}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-brand-green px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-green-dark"
            />
          </div>
        ) : null}

        {guides.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-bold text-gray-900">Guías</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <Link
                  key={guide.id}
                  href={`/guias/${guide.slug}/`}
                  className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <h3 className="font-display text-lg font-semibold text-gray-900">{guide.title}</h3>
                  {guide.excerpt ? <p className="mt-2 text-sm text-gray-600">{guide.excerpt}</p> : null}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {brands.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-bold text-gray-900">Marcas</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/marcas/${brand.slug}/`}
                  className="rounded-full border border-brand-green-dark/30 px-4 py-1.5 text-sm font-semibold text-brand-green-dark transition hover:bg-brand-green-light"
                >
                  {brand.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
