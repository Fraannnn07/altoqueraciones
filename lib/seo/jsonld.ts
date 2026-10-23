import { siteConfig } from '@/lib/site-config';
import { isOnSale, type Pricing } from '@/lib/pricing';
import { deliveryZones } from '@/lib/delivery';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/** Identificadores de los nodos que se repiten en todas las páginas, para referenciarlos desde los demás. */
const organizationId = `${siteConfig.url}/#organizacion`;
const websiteId = `${siteConfig.url}/#sitio`;

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['PetStore', 'LocalBusiness'],
    '@id': organizationId,
    name: siteConfig.name,
    alternateName: siteConfig.alternateName,
    description: siteConfig.description,
    url: `${siteConfig.url}/`,
    logo: `${siteConfig.url}/icon-512.png`,
    image: `${siteConfig.url}/og-default.jpg`,
    telephone: siteConfig.telephone,
    address: {
      '@type': 'PostalAddress',
      addressCountry: siteConfig.address.country,
      addressLocality: siteConfig.address.locality,
    },
    // Llegamos a todo Montevideo; los barrios son los de envío sin costo.
    areaServed: [
      { '@type': 'City', name: siteConfig.address.locality },
      ...deliveryZones.map((zone) => ({
        '@type': 'AdministrativeArea',
        name: `${zone}, Montevideo`,
      })),
    ],
    priceRange: siteConfig.priceRange,
    currenciesAccepted: 'UYU',
    sameAs: [...siteConfig.sameAs],
  };
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId,
    name: siteConfig.name,
    alternateName: siteConfig.alternateName,
    url: `${siteConfig.url}/`,
    inLanguage: 'es-UY',
    publisher: { '@id': organizationId },
  };
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.url}`,
    })),
  };
}

/**
 * Producto con su oferta, para los resultados de productos de Google. Solo datos reales del catálogo: sin
 * envío ni devoluciones por ahora (el envío sin costo depende del barrio y del día, y no hay una política de
 * devolución con plazos), y sin imagen cuando el producto no tiene foto, porque un logo no sirve como foto.
 */
export function buildProductJsonLd(product: {
  id: number;
  /** Nombre completo: marca + nombre + presentación ("Dominal Pipeta para Perros 10 a 25 kg"). */
  name: string;
  slug: string;
  sku: string | null;
  description: string;
  pricing: Pricing;
  stock_status: 'in_stock' | 'out_of_stock';
  brandName: string;
  images: string[];
  /** Ruta de categorías ("Raciones para Perros > Adultos"). */
  category: string;
  presentation: string;
  netWeightKg: number | null;
}) {
  const url = `${siteConfig.url}/producto/${product.slug}/`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#producto`,
    name: product.name,
    description: product.description,
    url,
    // Sin código propio cargado, el id interno sirve de SKU estable (no cambia si cambia el slug).
    sku: product.sku || `ATR-${product.id}`,
    image: product.images.length > 0 ? product.images : undefined,
    brand: {
      '@type': 'Brand',
      name: product.brandName,
    },
    category: product.category,
    size: product.presentation || undefined,
    weight: product.netWeightKg
      ? { '@type': 'QuantitativeValue', value: product.netWeightKg, unitCode: 'KGM' }
      : undefined,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'UYU',
      price: product.pricing.final,
      // Con descuento, Google puede mostrar el precio de lista tachado.
      priceSpecification: isOnSale(product.pricing)
        ? {
            '@type': 'UnitPriceSpecification',
            priceType: 'https://schema.org/StrikethroughPrice',
            price: product.pricing.regular,
            priceCurrency: 'UYU',
          }
        : undefined,
      availability:
        product.stock_status === 'in_stock'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      eligibleRegion: { '@type': 'City', name: siteConfig.address.locality },
      seller: {
        '@type': 'Organization',
        '@id': organizationId,
        name: siteConfig.name,
      },
    },
  };
}

export function buildArticleJsonLd(guide: {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.excerpt,
    image: guide.coverImage ? [guide.coverImage] : undefined,
    datePublished: guide.publishedAt ?? undefined,
    dateModified: guide.updatedAt ?? guide.publishedAt ?? undefined,
    author: {
      '@type': 'Organization',
      '@id': organizationId,
      name: siteConfig.name,
    },
    publisher: { '@id': organizationId },
    mainEntityOfPage: `${siteConfig.url}/guias/${guide.slug}/`,
  };
}

export function buildFaqJsonLd(items: { question: string; answer: string }[]) {
  if (items.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
