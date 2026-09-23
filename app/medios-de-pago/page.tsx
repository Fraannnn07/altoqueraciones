import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { WhatsAppCtaButton } from '@/components/commerce/WhatsAppCtaButton';
import { buildGeneralWhatsAppUrl } from '@/lib/whatsapp';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site-config';

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: `Medios de Pago | ${siteConfig.name}`,
    description: 'Cómo coordinamos el pago de tu pedido en Al Toque Raciones.',
    path: '/medios-de-pago/',
  });
}

export default function PaymentMethodsPage() {
  const whatsappUrl = buildGeneralWhatsAppUrl('Hola, quiero consultar sobre medios de pago.');

  return (
    <div className="pb-16">
      <Breadcrumbs items={[{ name: 'Inicio', url: '/' }, { name: 'Medios de pago', url: '/medios-de-pago/' }]} />
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <h1 className="font-display text-3xl font-bold text-gray-900">Medios de pago</h1>
        <div className="prose prose-neutral mt-6 max-w-none">
          <p>
            Coordinamos el medio de pago por WhatsApp al confirmar tu pedido, junto con el detalle de la
            compra y el envío o retiro.
          </p>
        </div>
        <div className="mt-6">
          <WhatsAppCtaButton href={whatsappUrl}>Consultar medios de pago</WhatsAppCtaButton>
        </div>
      </div>
    </div>
  );
}
