import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { WhatsAppCtaButton } from '@/components/commerce/WhatsAppCtaButton';
import { buildGeneralWhatsAppUrl } from '@/lib/whatsapp';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site-config';

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: `Cambios y Devoluciones | ${siteConfig.name}`,
    description: 'Cómo gestionar un cambio o una devolución en Al Toque Raciones.',
    path: '/cambios-y-devoluciones/',
  });
}

export default function ReturnsPage() {
  const whatsappUrl = buildGeneralWhatsAppUrl('Hola, quiero hacer una consulta sobre un cambio o devolución.');

  return (
    <div className="pb-16">
      <Breadcrumbs
        items={[{ name: 'Inicio', url: '/' }, { name: 'Cambios y devoluciones', url: '/cambios-y-devoluciones/' }]}
      />
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <h1 className="font-display text-3xl font-bold text-gray-900">Cambios y devoluciones</h1>
        <div className="prose prose-neutral mt-6 max-w-none">
          <p>
            Si el producto llega dañado, incompleto o no es el que pediste, escribinos por WhatsApp contándonos
            qué pasó y vemos juntos un cambio o la solución que corresponda.
          </p>
        </div>
        <div className="mt-6">
          <WhatsAppCtaButton href={whatsappUrl}>Consultar por un cambio</WhatsAppCtaButton>
        </div>
      </div>
    </div>
  );
}
