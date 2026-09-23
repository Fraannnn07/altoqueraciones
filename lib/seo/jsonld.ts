import { siteConfig } from '@/lib/site-config';
import { deliveryZones } from '@/lib/delivery';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['PetStore', 'LocalBusiness'],
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    telephone: siteConfig.telephone,
    address: {
      '@type': 'PostalAddress',
      addressCountry: siteConfig.address.country,
      addressLocality: siteConfig.address.locality,
    },
    areaServed: deliveryZones.map((zone) => ({
      '@type': 'AdministrativeArea',
      name: `${zone}, Montevideo`,
    })),
    priceRange: siteConfig.priceRange,
    sameAs: [...siteConfig.sameAs],
  };
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    alternateName: siteConfig.alternateName,
    url: `${siteConfig.url}/`,
    inLanguage: 'es-UY',
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/icon-512.png`,
      },
    },
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

export function buildProductJsonLd(product: {
  name: string;
  slug: string;
  sku: string | null;
  short_description: string;
  price_uyu: number;
  stock_status: 'in_stock' | 'out_of_stock';
  brandName: string;
  images: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.short_description,
    sku: product.sku ?? undefined,
    image: product.images,
    brand: {
      '@type': 'Brand',
      name: product.brandName,
    },
    offers: {
      '@type': 'Offer',
      url: `${siteConfig.url}/producto/${product.slug}/`,
      priceCurrency: 'UYU',
      price: product.price_uyu,
      availability:
        product.stock_status === 'in_stock'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
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
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.excerpt,
    image: guide.coverImage ? [guide.coverImage] : undefined,
    datePublished: guide.publishedAt ?? undefined,
    author: {
      '@type': 'Organization',
      name: siteConfig.name,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/icon-512.png`,
      },
    },
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
