import Script from 'next/script';
import { siteConfig } from '@/lib/site-config';

/**
 * Carga gtag.js una sola vez y configura Google Analytics 4 y Google Ads (los que tengan ID).
 * `gtag()` se define enseguida y encola en dataLayer; la librería (~150 KB) baja recién con la página
 * ya cargada para no competir con el primer pintado en celular. Los eventos previos no se pierden.
 */
export function GoogleTag() {
  const ids = [siteConfig.googleAnalytics.id, siteConfig.googleAds.id].filter(Boolean);
  if (ids.length === 0) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${ids[0]}`} strategy="lazyOnload" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          ${ids.map((id) => `gtag('config', '${id}');`).join('\n          ')}
        `}
      </Script>
    </>
  );
}
