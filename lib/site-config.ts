export const siteConfig = {
  name: 'Al Toque Raciones',
  alternateName: 'Al Toque',
  url: process.env.SITE_URL || 'https://altoqueraciones.com',
  description:
    'Raciones para perros y gatos en Montevideo. Te las llevamos a tu puerta en 24 horas, con regalo. Envío sin costo lunes a miércoles en barrios seleccionados.',
  telephone: '+59898623158',
  whatsappNumber: process.env.OWNER_WHATSAPP || '59898623158',
  address: {
    country: 'UY',
    locality: 'Montevideo',
  },
  priceRange: '$$',
  sameAs: ['https://www.instagram.com/altoqueraciones.uy'],
  googleAnalytics: {
    id: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
  },
  googleAds: {
    id: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || '',
    conversionLabel: process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL || '',
  },
} as const;
