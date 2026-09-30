import type { Metadata } from 'next';
import { Nunito, Quicksand } from 'next/font/google';
import './globals.css';
import { siteConfig } from '@/lib/site-config';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildOrganizationJsonLd, buildWebsiteJsonLd } from '@/lib/seo/jsonld';
import { GoogleTag } from '@/components/seo/GoogleTag';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SiteChrome } from '@/components/layout/SiteChrome';
import { DiscountTicker } from '@/components/layout/DiscountTicker';

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
});

const quicksand = Quicksand({
  variable: '--font-quicksand',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `Alimento para Perros y Gatos en Montevideo | ${siteConfig.name}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  other: {
    'theme-color': '#0E5C36',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${nunito.variable} ${quicksand.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <SiteChrome
          header={<Header />}
          footer={<Footer />}
          homeAnnouncement={<DiscountTicker />}
          extras={
            <>
              <JsonLd data={buildOrganizationJsonLd()} />
              <JsonLd data={buildWebsiteJsonLd()} />
              <GoogleTag />
            </>
          }
        >
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
