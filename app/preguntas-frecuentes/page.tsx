import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildFaqJsonLd } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site-config';
import { siteFaq } from '@/lib/faq';

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: `Preguntas Frecuentes | ${siteConfig.name}`,
    description: 'Zonas de envío, días de entrega y retiro, y cómo consultar por un alimento en Al Toque Raciones.',
    path: '/preguntas-frecuentes/',
  });
}

export default function FaqPage() {
  return (
    <div className="pb-16">
      <Breadcrumbs
        items={[{ name: 'Inicio', url: '/' }, { name: 'Preguntas frecuentes', url: '/preguntas-frecuentes/' }]}
      />
      <JsonLd data={buildFaqJsonLd(siteFaq)} />
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <h1 className="font-display text-3xl font-bold text-gray-900">Preguntas frecuentes</h1>
        <dl className="mt-6 space-y-6">
          {siteFaq.map((item) => (
            <div key={item.question}>
              <dt className="font-display font-semibold text-gray-900">{item.question}</dt>
              <dd className="mt-1 text-gray-600">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
