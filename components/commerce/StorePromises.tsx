import { DiscountTagIcon, GiftIcon, TruckIcon } from '@/components/icons';
import { storePromises, type StorePromiseId } from '@/lib/store-promises';

const icons: Record<StorePromiseId, typeof TruckIcon> = {
  entrega: TruckIcon,
  regalo: GiftIcon,
  sellos: DiscountTagIcon,
};

/**
 * Las promesas de cada pedido (lib/store-promises.ts). `compact`: una línea de íconos con título, para
 * categorías y fichas; `cards`: tarjetas con el detalle, para el inicio.
 */
export function StorePromises({
  variant = 'compact',
  className = '',
}: {
  variant?: 'compact' | 'cards';
  className?: string;
}) {
  if (variant === 'cards') {
    return (
      <ul className={`grid gap-3 sm:grid-cols-3 sm:gap-4 ${className}`}>
        {storePromises.map((promise) => {
          const Icon = icons[promise.id];
          return (
            <li key={promise.id} className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm">
              <Icon className={`${promise.id === 'entrega' ? 'h-8 w-11' : 'h-8 w-8'} shrink-0 text-brand-forest`} />
              <span>
                <span className="block font-extrabold text-brand-forest">{promise.title}</span>
                <span className="block text-sm text-gray-600">{promise.detail}</span>
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className={`flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-gray-700 ${className}`}>
      {storePromises.map((promise) => {
        const Icon = icons[promise.id];
        return (
          <li key={promise.id} className="flex items-center gap-2">
            <Icon className={`${promise.id === 'entrega' ? 'h-5 w-7' : 'h-5 w-5'} shrink-0 text-brand-forest`} />
            {promise.title}
          </li>
        );
      })}
    </ul>
  );
}
