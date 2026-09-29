'use client';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Registra un clic a WhatsApp: la conversión "Compra por WhatsApp" en Google Ads (reusa el label histórico
 * de la cuenta) y el evento `generate_lead` en GA4.
 */
export function trackWhatsAppConversion() {
  if (typeof window === 'undefined' || !window.gtag) return;

  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const adsLabel = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL;
  if (adsId && adsLabel) {
    window.gtag('event', 'conversion', { send_to: `${adsId}/${adsLabel}` });
  }

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (gaId) {
    window.gtag('event', 'generate_lead', { send_to: gaId, lead_source: 'whatsapp' });
  }
}
