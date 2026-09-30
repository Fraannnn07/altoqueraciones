import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { getActiveBrandsWithProducts } from '@/lib/data/brands';
import { safe } from '@/lib/data/safe';
import { storageUrl } from '@/lib/storage';

// Ancho de cada logo en escritorio (tarjeta de 112 px + separación), para que una vuelta cubra
// pantallas anchas aunque haya pocas marcas y la velocidad no dependa de cuántas son.
const ITEM_PX = 132;
const MIN_TRACK_PX = 2000;
const SPEED_PX_PER_SECOND = 30;

/** Carrusel de logos de las marcas con productos, al tope del footer. Cada logo lleva a su marca. */
export async function BrandMarquee() {
  const brands = (await safe(() => getActiveBrandsWithProducts(), []))
    .filter((brand) => brand.logo_path)
    .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name, 'es'));
  if (brands.length === 0) return null;

  const repetitions = Math.max(1, Math.ceil(MIN_TRACK_PX / (brands.length * ITEM_PX)));
  const items = Array.from({ length: repetitions }, () => brands).flat();
  const duration = Math.round((items.length * ITEM_PX) / SPEED_PX_PER_SECOND);

  return (
    <section aria-labelledby="marcas-footer" className="border-b border-black/5 bg-brand-cream py-8">
      <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-4 px-4">
        <h2 id="marcas-footer" className="font-display text-lg font-bold text-gray-900">
          Nuestras marcas
        </h2>
        <Link href="/marcas/" className="inline-block py-1 text-sm font-semibold text-brand-green-dark hover:underline">
          Ver todas
        </Link>
      </div>
      <div className="atr-marquee atr-marquee-fade atr-marquee-scroll mt-5 overflow-hidden">
        {/* Dos copias iguales: la animación corre la mitad del ancho y el loop no se nota. */}
        <div
          className="atr-marquee-track flex w-max py-2"
          style={{ '--atr-marquee-duration': `${duration}s` } as CSSProperties}
        >
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              aria-hidden={copy === 1 ? true : undefined}
              className="atr-marquee-copy flex shrink-0 gap-4 pr-4 sm:gap-5 sm:pr-5"
            >
              {items.map((brand, index) => {
                // Las repeticiones no se anuncian ni reciben foco: cada marca se recorre una sola vez con Tab.
                const repeated = copy === 1 || index >= brands.length;
                return (
                  <li key={`${brand.id}-${index}`} aria-hidden={repeated && copy === 0 ? true : undefined}>
                    <Link
                      href={`/marcas/${brand.slug}/`}
                      tabIndex={repeated ? -1 : undefined}
                      className="block rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-black/5 transition hover:ring-brand-forest/30"
                    >
                      <Image
                        src={storageUrl(brand.logo_path) as string}
                        alt={repeated ? '' : brand.name}
                        width={112}
                        height={112}
                        className="h-[4.25rem] w-[4.25rem] object-contain sm:h-[6.25rem] sm:w-[6.25rem]"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
