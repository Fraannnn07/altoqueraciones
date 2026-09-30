import type { CSSProperties } from 'react';
import { getSiteDiscount } from '@/lib/data/site-settings';
import { safe } from '@/lib/data/safe';
import { siteDiscountMessage } from '@/lib/pricing';

// Ancho aproximado de cada repetición (texto en negrita + separador), para cubrir pantallas de
// hasta ~2600 px aunque el mensaje sea corto y para que la velocidad no dependa del largo.
const CHAR_PX = 8;
const GAP_PX = 48;
const MIN_TRACK_PX = 2600;
const SPEED_PX_PER_SECOND = 50;

/** Barra fina y animada con el descuento general, arriba del header. Solo aparece si está activo. */
export async function DiscountTicker() {
  const discount = await safe(() => getSiteDiscount(), null);
  if (!discount?.active || discount.percent <= 0) return null;

  const message = siteDiscountMessage(discount.percent, discount.message);
  const itemWidth = message.length * CHAR_PX + GAP_PX;
  const repetitions = Math.min(30, Math.max(3, Math.ceil(MIN_TRACK_PX / itemWidth)));
  const duration = Math.round((repetitions * itemWidth) / SPEED_PX_PER_SECOND);

  return (
    <div className="atr-marquee overflow-hidden bg-brand-sale text-white">
      <p className="sr-only">{message}</p>
      {/* Dos copias iguales: la animación corre la mitad del ancho y el loop no se nota. */}
      <div
        className="atr-marquee-track flex w-max"
        aria-hidden="true"
        style={{ '--atr-marquee-duration': `${duration}s` } as CSSProperties}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0">
            {Array.from({ length: repetitions }, (_, index) => (
              <span
                key={index}
                className="flex items-center gap-6 whitespace-nowrap py-1.5 pr-6 text-xs font-bold sm:text-sm"
              >
                {message}
                <span className="text-white/70">•</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
