import Image from 'next/image';
import Link from 'next/link';
import logo from '@/assets/logo-al-toque.webp';
import { WhatsAppCtaButton } from '@/components/commerce/WhatsAppCtaButton';
import { InstagramIcon, MapPinIcon, TruckIcon, WhatsAppIcon } from '@/components/icons';
import { BrandMarquee } from '@/components/layout/BrandMarquee';
import { deliveryInfo } from '@/lib/delivery';
import { siteConfig } from '@/lib/site-config';
import { buildGeneralWhatsAppUrl } from '@/lib/whatsapp';

const columns = [
  {
    title: 'Tienda',
    links: [
      { href: '/raciones-perros/', label: 'Raciones para perros' },
      { href: '/raciones-gatos/', label: 'Raciones para gatos' },
      { href: '/marcas/', label: 'Marcas' },
    ],
  },
  {
    title: 'Ayuda',
    links: [
      { href: '/envios/', label: 'Envíos y retiros' },
      { href: '/medios-de-pago/', label: 'Medios de pago' },
      { href: '/cambios-y-devoluciones/', label: 'Cambios y devoluciones' },
      { href: '/preguntas-frecuentes/', label: 'Preguntas frecuentes' },
    ],
  },
  {
    title: 'Al Toque',
    links: [
      { href: '/nosotros/', label: 'Nosotros' },
      { href: '/guias/', label: 'Guías' },
      { href: '/contacto/', label: 'Contacto' },
    ],
  },
];

// +59898623158 → +598 98 623 158 (si el número cambia de formato, se muestra tal cual).
const phoneLabel = siteConfig.telephone.replace(/^\+598(\d{2})(\d{3})(\d{3})$/, '+598 $1 $2 $3');

const socialClassName =
  'flex h-11 w-11 items-center justify-center rounded-full text-white ring-1 ring-white/25 transition hover:bg-white/10 hover:ring-white/50';

/**
 * Pie del sitio: carrusel de marcas y, sobre verde bosque, una franja con envío, retiro y WhatsApp
 * (los datos salen de lib/delivery.ts), el logo con las redes y tres columnas de links.
 */
export function Footer() {
  const whatsappUrl = buildGeneralWhatsAppUrl();

  return (
    <footer className="mt-16 border-t border-black/5">
      <BrandMarquee />

      <div className="bg-brand-forest-dark text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
          <ul className="grid overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 lg:grid-cols-3">
            <li>
              <Link href="/envios/" className="flex h-full items-center gap-4 px-5 py-4 transition hover:bg-white/5 lg:py-5">
                <TruckIcon className="h-9 w-12 shrink-0" />
                <span>
                  <span className="block font-extrabold">Envío sin costo</span>
                  <span className="block text-sm text-white/75">
                    De {deliveryInfo.freeDeliveryDaysLabel} en barrios seleccionados de Montevideo.
                  </span>
                </span>
              </Link>
            </li>
            <li className="border-t border-white/10 lg:border-l lg:border-t-0">
              <Link href="/envios/" className="flex h-full items-center gap-4 px-5 py-4 transition hover:bg-white/5 lg:py-5">
                <MapPinIcon className="h-9 w-12 shrink-0" />
                <span>
                  <span className="block font-extrabold">Retiro sin costo</span>
                  <span className="block text-sm text-white/75">
                    Los {deliveryInfo.pickup.daysLabel} en zona {deliveryInfo.pickup.area}, {deliveryInfo.pickup.note}.
                  </span>
                </span>
              </Link>
            </li>
            <li className="border-t border-white/10 lg:border-l lg:border-t-0">
              <WhatsAppCtaButton
                href={whatsappUrl}
                className="flex h-full items-center gap-4 px-5 py-4 transition hover:bg-white/5 lg:py-5"
              >
                <WhatsAppIcon className="h-8 w-12 shrink-0" />
                <span>
                  <span className="block font-extrabold">Pedidos por WhatsApp</span>
                  <span className="block text-sm text-white/75">{phoneLabel}</span>
                </span>
              </WhatsAppCtaButton>
            </li>
          </ul>

          <div className="mt-10 grid gap-10 sm:mt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12">
            {/* En tablet, el logo al lado del texto; en celular y escritorio, uno debajo del otro. */}
            <div className="sm:flex sm:items-center sm:gap-8 lg:block">
              <Link href="/" className="inline-block shrink-0 rounded-2xl bg-brand-cream px-4 py-3">
                <Image src={logo} alt={siteConfig.name} sizes="128px" className="h-auto w-28 sm:w-32" />
              </Link>
              <div>
                <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/75 sm:mt-0 lg:mt-5">
                  Alimento para perros y gatos en Montevideo, con el precio y los kilos siempre a la vista.
                  Coordinamos cada pedido por WhatsApp.
                </p>
                <div className="mt-5 flex gap-3">
                  <WhatsAppCtaButton href={whatsappUrl} className={socialClassName}>
                    <WhatsAppIcon className="h-5 w-5" />
                    <span className="sr-only">WhatsApp</span>
                  </WhatsAppCtaButton>
                  <a href={siteConfig.sameAs[0]} target="_blank" rel="noopener noreferrer" className={socialClassName}>
                    <InstagramIcon className="h-5 w-5" />
                    <span className="sr-only">Instagram</span>
                  </a>
                </div>
              </div>
            </div>

            <nav aria-label="Pie de página" className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
              {columns.map((column) => (
                <div key={column.title}>
                  <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-amber">
                    {column.title}
                  </h2>
                  <ul className="mt-3 space-y-1 text-sm">
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className="inline-block py-1 text-white/75 transition hover:text-white">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          <p className="mt-10 border-t border-white/10 pt-6 text-xs text-white/60 sm:mt-12">
            © {new Date().getFullYear()} {siteConfig.name} · {siteConfig.address.locality}, Uruguay
          </p>
        </div>
      </div>
    </footer>
  );
}
