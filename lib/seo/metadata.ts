import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';
import { formatPricePerKg, formatUyu, productFullName } from '@/lib/format';
import { deliveryInfo } from '@/lib/delivery';

interface BuildMetadataInput {
  title: string;
  description: string;
  path: string; // ej. "/raciones-perros/" (con slash inicial y final)
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

/** Largo máximo de una meta description antes de que Google la corte. */
const DESCRIPTION_MAX = 160;

export function buildMetadata({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
}: BuildMetadataInput): Metadata {
  const url = `${siteConfig.url}${path}`;
  const ogImage = image ?? `${siteConfig.url}/og-default.jpg`;

  return {
    // "absolute": los títulos ya llevan el nombre del sitio; sin esto el template del layout lo duplicaba.
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: {
      title,
      description,
      url,
      type,
      locale: 'es_UY',
      siteName: siteConfig.name,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

/** La primera variante que entra en el largo de una meta description (o la última, si ninguna entra). */
function firstThatFits(variants: string[]) {
  return variants.find((text) => text.length <= DESCRIPTION_MAX) ?? variants[variants.length - 1];
}

const deliveryPromise = `Te lo llevamos a tu puerta en ${deliveryInfo.leadTimeLabel}`;

export function categoryTitle(name: string) {
  return `${name} en Montevideo | ${siteConfig.name}`;
}

/** Descripción de respaldo para categorías sin meta_description cargada en la base. */
export function categoryDescription(name: string) {
  return firstThatFits([
    `${name} en Montevideo, con precio y kilos a la vista. ${deliveryPromise}, con regalo en cada pedido. Pedí por WhatsApp.`,
    `${name} en Montevideo, con precio y kilos a la vista. ${deliveryPromise}.`,
  ]);
}

/**
 * H1 de una subcategoría: su meta_title sin la marca ni "en Montevideo" ("Raciones para Perros Adultos").
 * El nombre solo ("Adultos") sirve para los botones de la categoría, pero no como título.
 */
export function subcategoryHeading(sub: { name: string; meta_title: string | null }, parent: { name: string }) {
  const fromTitle = sub.meta_title
    ?.split(' | ')[0]
    .replace(/\s+en Montevideo$/i, '')
    .trim();
  return fromTitle || `${parent.name}: ${sub.name}`;
}

export function brandTitle(name: string) {
  return `${name} en Montevideo | ${siteConfig.name}`;
}

export interface BrandFacts {
  productCount: number;
  /** Categorías raíz donde hay productos de la marca ("raciones para perros", "arena para gatos"). */
  categoryNames: string[];
  minPrice: number | null;
}

/** "a, b y c" */
function joinList(items: string[]) {
  return items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

/** Meta description de una marca armada con datos reales del catálogo (cantidad, categorías y precio desde). */
export function brandDescription(name: string, facts?: BrandFacts) {
  if (!facts || facts.productCount === 0) {
    return `Productos ${name} en Montevideo, con precio y kilos a la vista. ${deliveryPromise}. Pedí por WhatsApp.`;
  }
  const what = `${facts.productCount} ${facts.productCount === 1 ? 'producto' : 'productos'}`;
  const where = facts.categoryNames.length > 0 ? ` de ${joinList(facts.categoryNames.map((c) => c.toLowerCase()))}` : '';
  const from = facts.minPrice ? `, desde ${formatUyu(facts.minPrice)}` : '';
  return firstThatFits([
    `${name} en Montevideo: ${what}${where}${from}. ${deliveryPromise}, con regalo en cada pedido.`,
    `${name} en Montevideo: ${what}${where}${from}. ${deliveryPromise}.`,
    `${name} en Montevideo: ${what}${from}. ${deliveryPromise}.`,
  ]);
}

export function productTitle(name: string, presentation: string, brandName: string) {
  return `${productFullName(brandName, name, presentation)} | ${siteConfig.name}`;
}

/**
 * Meta description única por producto armada con datos reales (marca, precio, precio por kilo y la entrega),
 * en vez de la descripción corta, que se repite entre las distintas bolsas de una misma línea.
 */
export function productDescription(product: {
  name: string;
  presentation?: string | null;
  brandName: string;
  priceUyu: number;
  netWeightKg: number | null;
}) {
  const label = productFullName(product.brandName, product.name, product.presentation);
  const price = formatUyu(product.priceUyu);
  const perKg = formatPricePerKg(product.priceUyu, product.netWeightKg);
  const withPerKg = perKg ? `${price} (${perKg})` : price;
  return firstThatFits([
    `${label} a ${withPerKg}. ${deliveryPromise} en Montevideo, con regalo en cada pedido.`,
    `${label} a ${price}. ${deliveryPromise} en Montevideo, con regalo en cada pedido.`,
    `${label} a ${price}. ${deliveryPromise} en Montevideo.`,
  ]);
}
