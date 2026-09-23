import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';
import { brandedProductName } from '@/lib/format';

interface BuildMetadataInput {
  title: string;
  description: string;
  path: string; // ej. "/raciones-perros/" (con slash inicial y final)
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

export function buildMetadata({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
}: BuildMetadataInput): Metadata {
  const url = `${siteConfig.url}${path}`;
  const ogImage = image ?? `${siteConfig.url}/og-default.png`;

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

export function categoryTitle(name: string) {
  return `${name} en Montevideo | ${siteConfig.name}`;
}

export function categoryDescription(name: string) {
  return `Comprá ${name.toLowerCase()} en Montevideo con precio y kilos visibles. Consultá por WhatsApp y coordiná envío o retiro.`;
}

export function brandTitle(name: string) {
  return `${name} en Montevideo | ${siteConfig.name}`;
}

export function brandDescription(name: string) {
  return `Productos ${name} disponibles en ${siteConfig.name}, con precio y kilos visibles. Consultá por WhatsApp.`;
}

export function productTitle(name: string, presentation: string, brandName: string) {
  const label = brandedProductName(brandName, name);
  const full = presentation ? `${label} ${presentation}` : label;
  return `${full} | ${siteConfig.name}`;
}

export function productDescription(name: string, shortDescription: string) {
  if (shortDescription) return shortDescription;
  return `Comprá ${name} en Montevideo. Consultá precio, kilos y disponibilidad por WhatsApp.`;
}
