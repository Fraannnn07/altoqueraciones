import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { WhatsAppCtaButton } from '@/components/commerce/WhatsAppCtaButton';
import { buildGeneralWhatsAppUrl } from '@/lib/whatsapp';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site-config';

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: `Contacto | ${siteConfig.name}`,
    description: `Contactá a ${siteConfig.name} por WhatsApp para consultar por un alimento o coordinar tu pedido en ${siteConfig.address.locality}.`,
    path: '/contacto/',
  });
}

export default function ContactPage() {
  const whatsappUrl = buildGeneralWhatsAppUrl();

  return (
    <div className="pb-16">
      <Breadcrumbs items={[{ name: 'Inicio', url: '/' }, { name: 'Contacto', url: '/contacto/' }]} />
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <h1 className="font-display text-3xl font-bold text-gray-900">Contacto</h1>
        <p className="mt-4 text-gray-700">
          Escribinos por WhatsApp al {siteConfig.telephone} para consultar por un alimento, coordinar tu pedido o
          resolver cualquier duda. Te respondemos por ahí.
        </p>
        <div className="mt-6">
          <WhatsAppCtaButton href={whatsappUrl}>Escribinos por WhatsApp</WhatsAppCtaButton>
        </div>
        <p className="mt-6 text-gray-600">
          Para ver zonas de envío y días de retiro, mirá{' '}
          <Link href="/envios/" className="underline hover:text-brand-green-dark">
            envíos y retiros
          </Link>
          .
        </p>
        <p className="mt-6 text-sm text-gray-500">
          También nos encontrás en{' '}
          <a href={siteConfig.sameAs[0]} target="_blank" rel="noopener noreferrer" className="underline">
            Instagram
          </a>
          .
        </p>
      </div>
    </div>
  );
}
