import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site-config';
import { deliveryInfo } from '@/lib/delivery';
import { WhatsAppCtaButton } from '@/components/commerce/WhatsAppCtaButton';
import { buildGeneralWhatsAppUrl } from '@/lib/whatsapp';

// Barrios más buscados para nombrar en la descripción; se filtran contra la lista real de zonas
// para que nunca se mencione uno al que no llegamos.
const highlightedZones = ['Pocitos', 'Malvín', 'Carrasco', 'Centro', 'Cordón'].filter((zone) =>
  (deliveryInfo.zones as readonly string[]).includes(zone),
);

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: `Envío Gratis de Raciones en Montevideo | ${siteConfig.name}`,
    description: `Delivery de raciones sin costo de ${deliveryInfo.freeDeliveryDaysLabel} en ${highlightedZones.join(', ')} y más barrios de Montevideo. Retiro ${deliveryInfo.pickup.daysLabel} en ${deliveryInfo.pickup.area}.`,
    path: '/envios/',
  });
}

export default function ShippingPage() {
  const whatsappUrl = buildGeneralWhatsAppUrl('Hola, quiero consultar por el envío a mi zona.');

  return (
    <div className="pb-16">
      <Breadcrumbs items={[{ name: 'Inicio', url: '/' }, { name: 'Envíos y retiros', url: '/envios/' }]} />
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <h1 className="font-display text-3xl font-bold text-gray-900">Envío de raciones en Montevideo</h1>
        <p className="mt-3 text-gray-700">
          Te llevamos la ración a tu casa sin costo, {deliveryInfo.freeDeliveryDaysLabel}, en {deliveryInfo.zones.length}{' '}
          barrios de Montevideo, y llegamos al resto de Montevideo con costo de envío. Si preferís, también podés retirarla
          sin costo {deliveryInfo.pickup.daysLabel} en zona {deliveryInfo.pickup.area}.
        </p>

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
            Llegamos a todo Montevideo. Escribinos por WhatsApp y te confirmamos el costo de envío a tu zona.
          </p>
          <div className="mt-4">
            <WhatsAppCtaButton href={whatsappUrl}>Consultar por mi zona</WhatsAppCtaButton>
          </div>
        </section>
      </div>
    </div>
  );
}
