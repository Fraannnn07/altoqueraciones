import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site-config';
import { deliveryInfo } from '@/lib/delivery';
import { WhatsAppCtaButton } from '@/components/commerce/WhatsAppCtaButton';
import { buildGeneralWhatsAppUrl } from '@/lib/whatsapp';

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: `Envíos y Retiros | ${siteConfig.name}`,
    description:
      'Envío sin costo lunes a miércoles en barrios seleccionados de Montevideo. Retiro sin costo jueves y viernes en zona Mercado Modelo.',
    path: '/envios/',
  });
}

export default function ShippingPage() {
  const whatsappUrl = buildGeneralWhatsAppUrl('Hola, quiero consultar por el envío a mi zona.');

  return (
    <div className="pb-16">
      <Breadcrumbs items={[{ name: 'Inicio', url: '/' }, { name: 'Envíos y retiros', url: '/envios/' }]} />
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <h1 className="font-display text-3xl font-bold text-gray-900">Envíos y retiros</h1>

        <section className="mt-8">
          <h2 className="font-display text-xl font-bold text-gray-900">Envío sin costo</h2>
          <p className="mt-2 text-gray-700">
            Entregamos sin costo {deliveryInfo.freeDeliveryDaysLabel} en los siguientes barrios de Montevideo:
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {deliveryInfo.zones.map((zone) => (
              <li key={zone} className="rounded-lg bg-brand-green-light px-3 py-1.5 text-sm text-gray-800">
                {zone}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-gray-900">Retiro sin costo</h2>
          <p className="mt-2 text-gray-700">
            Podés retirar tu pedido sin costo {deliveryInfo.pickup.daysLabel} en zona {deliveryInfo.pickup.area},{' '}
            {deliveryInfo.pickup.note}.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-gray-900">¿Tu barrio no está en la lista?</h2>
          <p className="mt-2 text-gray-700">
            Escribinos por WhatsApp y te confirmamos si podemos llegar a tu zona y qué costo tendría.
          </p>
          <div className="mt-4">
            <WhatsAppCtaButton href={whatsappUrl}>Consultar por mi zona</WhatsAppCtaButton>
          </div>
        </section>
      </div>
    </div>
  );
}
