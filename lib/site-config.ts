export const siteConfig = {
  name: 'Al Toque Raciones',
  alternateName: 'Al Toque',
  url: process.env.SITE_URL || 'https://altoqueraciones.com',
  description:
    'Alimento para perros en Montevideo. Envío sin costo lunes a miércoles en barrios seleccionados y retiro jueves y viernes en Mercado Modelo.',
  telephone: '+59898623158',
  whatsappNumber: process.env.OWNER_WHATSAPP || '59898623158',
  address: {
    country: 'UY',
    locality: 'Montevideo',
  },
  priceRange: '$$',
  sameAs: ['https://www.instagram.com/altoqueraciones.uy'],
  googleAds: {
    id: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || '',
    conversionLabel: process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL || '',
  },
} as const;
