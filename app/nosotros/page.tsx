import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site-config';
import { deliverySummary } from '@/lib/delivery';

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: `Nosotros | ${siteConfig.name}`,
    description: `Conocé ${siteConfig.name}, venta de alimento para perros en ${siteConfig.address.locality} por WhatsApp.`,
    path: '/nosotros/',
  });
}

export default function AboutPage() {
  return (
    <div className="pb-16">
      <Breadcrumbs items={[{ name: 'Inicio', url: '/' }, { name: 'Nosotros', url: '/nosotros/' }]} />
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <h1 className="font-display text-3xl font-bold text-gray-900">Nosotros</h1>
        <div className="prose prose-neutral mt-6 max-w-none">
          <p>
            {siteConfig.name} vende alimento para perros en {siteConfig.address.locality}. Trabajamos con
            combos y presentaciones de distintas marcas, con el precio y los kilos siempre visibles en cada
            ficha para que puedas comparar antes de decidir.
          </p>
          <p>
            Coordinamos cada pedido por WhatsApp: nos escribís, confirmamos el producto y vemos si te queda
            cómodo el envío o el retiro. {deliverySummary}{' '}
            <Link href="/envios/" className="underline hover:text-brand-green-dark">
              Mirá el detalle de zonas y días acá
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
