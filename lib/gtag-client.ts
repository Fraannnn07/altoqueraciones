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

const AD_VISIT_KEY = 'atr_visita_anuncio';
const AD_GREETING = 'Hola, vi el anuncio en Google.';

/**
 * Marca la sesión si se entró desde un anuncio de Google Ads (auto-etiquetado gclid/gbraid/wbraid o
 * utm_medium=cpc). Se llama una vez al cargar el sitio, en la página por la que se entró.
 */
export function rememberAdVisit() {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromGoogleAds =
      ['gclid', 'gbraid', 'wbraid'].some((key) => params.has(key)) ||
      (params.get('utm_source') === 'google' && params.get('utm_medium') === 'cpc');
    if (fromGoogleAds) sessionStorage.setItem(AD_VISIT_KEY, '1');
  } catch {
    // Sin sessionStorage (navegación privada estricta): el mensaje queda como está.
  }
}

/**
 * Si la visita vino de un anuncio, el mensaje de WhatsApp arranca con "Hola, vi el anuncio en Google." para
 * que esas consultas se reconozcan en el chat. Cambia el href antes de que el navegador siga el enlace.
 */
export function tagWhatsAppLinkForAds(link: HTMLAnchorElement) {
  try {
    if (sessionStorage.getItem(AD_VISIT_KEY) !== '1') return;
  } catch {
    return;
  }
  const url = new URL(link.href);
  const text = url.searchParams.get('text') ?? '';
  if (text.startsWith(AD_GREETING)) return;
  const rest = text.replace(/^Hola,?\s*/i, '');
  const message = rest ? `${AD_GREETING} ${rest.charAt(0).toUpperCase()}${rest.slice(1)}` : AD_GREETING;
  link.href = `${url.origin}${url.pathname}?text=${encodeURIComponent(message)}`;
}
