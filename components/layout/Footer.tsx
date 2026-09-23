import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import { deliverySummary } from '@/lib/delivery';

const links = [
  { href: '/raciones-perros/', label: 'Alimentos' },
  { href: '/guias/', label: 'Guías' },
  { href: '/nosotros/', label: 'Nosotros' },
  { href: '/contacto/', label: 'Contacto' },
  { href: '/envios/', label: 'Envíos y retiros' },
  { href: '/medios-de-pago/', label: 'Medios de pago' },
  { href: '/cambios-y-devoluciones/', label: 'Cambios y devoluciones' },
  { href: '/preguntas-frecuentes/', label: 'Preguntas frecuentes' },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-black/5 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-gray-600">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-brand-green-dark">
              {link.label}
            </Link>
          ))}
        </div>
        <p className="mt-6 text-xs text-gray-500">
          {siteConfig.name} — {siteConfig.address.locality}, {siteConfig.address.country}. {deliverySummary}
        </p>
      </div>
    </footer>
  );
}
