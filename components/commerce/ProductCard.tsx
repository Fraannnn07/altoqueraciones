import Image from 'next/image';
import Link from 'next/link';
import type { ProductCard as ProductCardType } from '@/lib/data/products';
import { storageUrl } from '@/lib/storage';
import { buildProductWhatsAppUrl } from '@/lib/whatsapp';
import { formatPricePerKg, formatUyu } from '@/lib/format';
import { WhatsAppCtaButton } from '@/components/commerce/WhatsAppCtaButton';

export function ProductCard({ product }: { product: ProductCardType }) {
  const imageUrl = storageUrl(product.primaryImage?.storage_path);
  const whatsappUrl = buildProductWhatsAppUrl(product);
  const pricePerKg = formatPricePerKg(product.price_uyu, product.net_weight_kg);

  return (
    <article className="atr-card flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/producto/${product.slug}/`} className="block">
        <div className="relative aspect-square bg-brand-warm-gray">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.primaryImage?.alt_text || product.name}
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              className="object-contain p-4"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              Sin imagen
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {product.brand.name}
          </p>
          <h3 className="mt-1 line-clamp-2 font-display text-base font-semibold text-gray-900">
            {product.name}
          </h3>
          {product.presentation ? (
            <p className="mt-0.5 text-sm text-gray-500">{product.presentation}</p>
          ) : null}
          <p className="mt-2 text-lg font-bold text-brand-green-dark">{formatUyu(product.price_uyu)}</p>
          {pricePerKg ? <p className="text-xs text-gray-500">{pricePerKg}</p> : null}
        </div>
      </Link>
      <div className="mt-auto px-4 pb-4">
        <WhatsAppCtaButton
          href={whatsappUrl}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-green-dark"
        />
      </div>
    </article>
  );
}
