import Link from 'next/link';
import type { Metadata } from 'next';
import { getFeaturedProducts } from '@/lib/data/products';
import { getPublishedGuides } from '@/lib/data/guides';
import { safe } from '@/lib/data/safe';
import { ProductCard } from '@/components/commerce/ProductCard';
import { WhatsAppCtaButton } from '@/components/commerce/WhatsAppCtaButton';
import { buildGeneralWhatsAppUrl } from '@/lib/whatsapp';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site-config';
import { deliveryInfo } from '@/lib/delivery';
import { siteFaq } from '@/lib/faq';

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: `Alimento para Perros en Montevideo | ${siteConfig.name}`,
    description: siteConfig.description,
    path: '/',
  });
}

export default async function HomePage() {
  const [featured, guides] = await Promise.all([
    getFeaturedProducts(),
    safe(() => getPublishedGuides(), []),
  ]);
  const whatsappUrl = buildGeneralWhatsAppUrl();
  const homeFaq = siteFaq.slice(0, 4);

  return (
    <div className="pb-16">
      {/* Propuesta */}
      <section className="bg-brand-green-light">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:py-16">
          <h1 className="font-display text-4xl font-bold text-brand-green-dark sm:text-5xl">
            Alimento para tu perro, al toque
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-700">
            Combos y presentaciones con precio y kilos siempre visibles. Consultás por WhatsApp y coordinamos
            envío o retiro.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/raciones-perros/"
              className="rounded-full bg-brand-green px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-green-dark"
            >
              Ver alimentos
            </Link>
            <WhatsAppCtaButton
              href={whatsappUrl}
              className="rounded-full border-2 border-brand-green px-6 py-3 text-sm font-bold text-brand-green-dark transition hover:bg-white"
            >
              Consultar por WhatsApp
            </WhatsAppCtaButton>
          </div>
        </div>
      </section>

      {/* Combos destacados */}
      {featured.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-bold text-gray-900">Alimentos disponibles</h2>
            <Link href="/raciones-perros/" className="inline-block py-1 text-sm font-semibold text-brand-green-dark hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Envíos y retiros */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-2xl font-bold text-gray-900">Envíos y retiros</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="font-semibold text-gray-900">Envío sin costo</h3>
              <p className="mt-1 text-sm text-gray-600">
                {deliveryInfo.freeDeliveryDaysLabel}, en barrios seleccionados de Montevideo.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Retiro sin costo</h3>
              <p className="mt-1 text-sm text-gray-600">
                {deliveryInfo.pickup.daysLabel}, en zona {deliveryInfo.pickup.area} ({deliveryInfo.pickup.note}).
              </p>
            </div>
          </div>
          <Link
            href="/envios/"
            className="mt-3 inline-block py-1 text-sm font-semibold text-brand-green-dark hover:underline"
          >
            Ver el listado completo de barrios →
          </Link>
        </div>
      </section>

      {/* Sobre nosotros */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-2xl font-bold text-gray-900">Sobre {siteConfig.name}</h2>
        <p className="mt-3 max-w-2xl text-gray-700">
          Vendemos alimento para perros en Montevideo, con el precio y los kilos siempre visibles en cada
          ficha. Coordinamos cada pedido por WhatsApp para que la consulta y la compra sean simples.
        </p>
      </section>

      {/* Guías */}
      {guides.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-bold text-gray-900">Guías</h2>
            <Link href="/guias/" className="inline-block py-1 text-sm font-semibold text-brand-green-dark hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {guides.slice(0, 4).map((guide) => (
              <Link
                key={guide.id}
                href={`/guias/${guide.slug}/`}
                className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <h3 className="font-display font-semibold text-gray-900">{guide.title}</h3>
                {guide.excerpt ? <p className="mt-2 text-sm text-gray-600">{guide.excerpt}</p> : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold text-gray-900">Preguntas frecuentes</h2>
          <Link href="/preguntas-frecuentes/" className="inline-block py-1 text-sm font-semibold text-brand-green-dark hover:underline">
            Ver todas
          </Link>
        </div>
        <dl className="mt-6 grid gap-6 sm:grid-cols-2">
          {homeFaq.map((item) => (
            <div key={item.question}>
              <dt className="font-display font-semibold text-gray-900">{item.question}</dt>
              <dd className="mt-1 text-sm text-gray-600">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
