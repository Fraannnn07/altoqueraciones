'use client';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Dispara la conversión "Compra por WhatsApp" en Google Ads. Reusa el label histórico de la cuenta. */
export function trackWhatsAppConversion() {
  const id = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL;
  if (!id || !label || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'conversion', { send_to: `${id}/${label}` });
}
