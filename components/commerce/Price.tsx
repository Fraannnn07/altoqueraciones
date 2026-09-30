import { formatUyu } from '@/lib/format';
import { isOnSale, type Pricing } from '@/lib/pricing';

const styles = {
  card: { final: 'text-lg', regular: 'text-sm', normalColor: 'text-brand-green-dark' },
  detail: { final: 'text-3xl', regular: 'text-lg', normalColor: 'text-gray-900' },
} as const;

/**
 * Precio del producto. Con descuento: el de lista arriba, más chico y tachado, y el final del mismo
 * tamaño que un precio normal pero en el color de oferta. En la ficha se suma la etiqueta "15% OFF".
 */
export function Price({
  pricing,
  size = 'card',
  className = '',
}: {
  pricing: Pricing;
  size?: keyof typeof styles;
  className?: string;
}) {
  const style = styles[size];

  if (!isOnSale(pricing)) {
    return <p className={`${className} ${style.final} font-bold ${style.normalColor}`}>{formatUyu(pricing.regular)}</p>;
  }

  return (
    <div className={className}>
      <p className={`${style.regular} leading-tight text-gray-500`}>
        <span className="sr-only">Antes: </span>
        <s>{formatUyu(pricing.regular)}</s>
      </p>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={`${style.final} font-bold text-brand-sale`}>
          <span className="sr-only">Ahora: </span>
          {formatUyu(pricing.final)}
        </span>
        {size === 'detail' ? (
          <span className="rounded-full bg-brand-sale px-2.5 py-0.5 text-sm font-bold text-white">
            {pricing.discountPercent}% OFF
          </span>
        ) : null}
      </p>
    </div>
  );
}
