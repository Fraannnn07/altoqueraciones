import Image from 'next/image';
import Link from 'next/link';
import heroImage from '@/assets/hero-perro-gato.webp';
import { WhatsAppCtaButton } from '@/components/commerce/WhatsAppCtaButton';
import { ArrowRightIcon, MapPinIcon, TruckIcon, WhatsAppIcon } from '@/components/icons';
import { deliveryInfo } from '@/lib/delivery';

/** Trazo de pincel en ámbar debajo de "al toque.", detrás del texto (la cola de la "q" lo cruza). */
function BrushUnderline() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 300 20"
      preserveAspectRatio="none"
      className="absolute -bottom-[0.06em] left-[-0.03em] -z-10 h-[0.3em] w-[97%] text-brand-amber"
    >
      <path fill="currentColor" d="M4 11C70 5 180 3 296 7c3 .5 3 4.5 0 5-116-2-226 1-290 7-5 .5-6-7-2-8Z" />
    </svg>
  );
}

/**
 * Hero del inicio. En celular va todo en una columna (texto, botones a lo ancho y la foto abajo);
 * desde 1024 px, texto y foto lado a lado con el cartel "De la bolsa al bowl." sobre la foto.
 * La franja de abajo en celular muestra solo el retiro: envíos y WhatsApp ya están arriba.
 */
export function HomeHero({ productsHref, whatsappUrl }: { productsHref: string; whatsappUrl: string }) {
  return (
    <section className="overflow-hidden bg-brand-cream">
      <div className="mx-auto grid max-w-6xl px-4 pt-7 sm:pt-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-8 lg:pt-12">
        <div>
          <h1 className="text-brand-forest">
            <span className="block text-[0.72rem] font-extrabold uppercase tracking-[0.22em] sm:text-sm">
              Raciones para perros y gatos
            </span>{' '}
            <span className="mt-3 block text-[clamp(1.95rem,9.2vw,3.75rem)] font-black leading-[1.04] tracking-[-0.035em] lg:text-[3.2rem] xl:text-[3.7rem]">
              <span className="block">Su comida favorita,</span>{' '}
              <span className="block">en tu puerta,</span>{' '}
              <span className="relative isolate inline-block">
                al toque.
                <BrushUnderline />
              </span>
            </span>
          </h1>

          <p className="mt-5 max-w-md text-[1.05rem] leading-relaxed text-gray-700 sm:text-lg">
            Elegí su alimento, consultanos por WhatsApp y coordinamos la entrega. Así de fácil.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={productsHref}
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-brand-forest px-7 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-brand-forest-dark"
            >
              Ver alimentos
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <WhatsAppCtaButton
              href={whatsappUrl}
              className="inline-flex items-center justify-center gap-3 rounded-xl border-2 border-brand-forest px-7 py-3 text-base font-bold text-brand-forest transition hover:bg-brand-forest hover:text-white"
            >
              <WhatsAppIcon className="h-6 w-6" />
              Pedir por WhatsApp
            </WhatsAppCtaButton>
          </div>

          <p className="mt-5 flex items-center gap-3 text-sm text-gray-600">
            <TruckIcon className="h-7 w-10 shrink-0 text-brand-forest" />
            Envío gratis de {deliveryInfo.freeDeliveryDaysLabel} en barrios seleccionados de Montevideo.
          </p>
        </div>

        <div className="relative mx-auto mt-6 w-full max-w-lg lg:mt-0 lg:max-w-none">
          <Image
            src={heroImage}
            alt="Un perro y un gato sentados junto a una bolsa de alimento y un bowl con ración"
            placeholder="blur"
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 1152px) 510px, (min-width: 1024px) 45vw, (min-width: 544px) 512px, calc(100vw - 32px)"
            className="h-auto w-full"
          />
          <p className="absolute right-0 top-[12%] hidden -rotate-6 items-center gap-3 rounded-2xl bg-[#f4ecdc] px-4 py-3 font-black leading-tight text-brand-forest shadow-[0_12px_30px_-14px_rgb(19_75_50/0.45)] lg:flex">
            <TruckIcon className="h-8 w-11 shrink-0" />
            <span>
              De la bolsa
              <br />
              al bowl.
            </span>
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-6 md:pb-10">
        <ul className="grid border-t border-brand-forest/15 md:grid-cols-3 md:rounded-2xl md:border">
          <li className="hidden md:block">
            <Link href="/envios/" className="flex h-full items-center gap-4 rounded-l-2xl px-5 py-5 transition hover:bg-white/60">
              <TruckIcon className="h-9 w-12 shrink-0 text-brand-forest" />
              <span>
                <span className="block font-extrabold text-brand-forest">Envíos en Montevideo</span>
                <span className="block text-sm text-gray-600">Consultá tu barrio</span>
              </span>
            </Link>
          </li>
          <li className="hidden items-center gap-4 border-brand-forest/15 px-5 py-5 md:flex md:border-l">
            <WhatsAppIcon className="h-9 w-9 shrink-0 text-brand-forest" />
            <span>
              <span className="block font-extrabold text-brand-forest">Comprá por WhatsApp</span>
              <span className="block text-sm text-gray-600">Atención cercana</span>
            </span>
          </li>
          <li className="border-brand-forest/15 md:border-l">
            <Link
              href="/envios/"
              className="flex h-full items-center justify-center gap-3 px-2 py-4 transition hover:bg-white/60 md:justify-start md:gap-4 md:rounded-r-2xl md:px-5 md:py-5"
            >
              <MapPinIcon className="h-7 w-7 shrink-0 text-brand-forest md:h-9 md:w-9" />
              {/* En celular, una línea ("Retiro coordinado · Zona …"); en pantallas muy angostas o desde md, dos. */}
              <span className="text-sm min-[380px]:flex min-[380px]:items-baseline min-[380px]:gap-x-2 md:block md:text-base">
                <span className="block font-extrabold text-brand-forest">Retiro coordinado</span>
                <span aria-hidden="true" className="hidden text-gray-400 min-[380px]:inline md:hidden">
                  ·
                </span>
                <span className="block text-gray-600 md:text-sm">Zona {deliveryInfo.pickup.area}</span>
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
