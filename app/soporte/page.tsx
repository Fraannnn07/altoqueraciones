import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { WhatsAppCtaButton } from '@/components/commerce/WhatsAppCtaButton';
import { buildGeneralWhatsAppUrl } from '@/lib/whatsapp';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site-config';

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: `Soporte | ${siteConfig.name}`,
    description: `¿Tenés algún inconveniente con tu pedido? Contactá a ${siteConfig.name} por WhatsApp y lo resolvemos.`,
    path: '/soporte/',
  });
}

export default function SupportPage() {
  const whatsappUrl = buildGeneralWhatsAppUrl('Hola, tengo un inconveniente y necesito ayuda.');

  return (
    <div className="pb-16">
      <Breadcrumbs items={[{ name: 'Inicio', url: '/' }, { name: 'Soporte', url: '/soporte/' }]} />
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <h1 className="font-display text-3xl font-bold text-gray-900">Soporte</h1>
        <p className="mt-4 text-gray-700">
          ¿Tenés algún inconveniente? Escribinos por WhatsApp al {siteConfig.telephone} contándonos qué pasó y te
          ayudamos a resolverlo.
        </p>
        <div className="mt-6">
          <WhatsAppCtaButton href={whatsappUrl}>Contactanos por WhatsApp</WhatsAppCtaButton>
        </div>
        <p className="mt-6 text-gray-600">
          Capaz que tu duda ya está respondida en{' '}
          <Link href="/preguntas-frecuentes/" className="underline hover:text-brand-green-dark">
            preguntas frecuentes
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
