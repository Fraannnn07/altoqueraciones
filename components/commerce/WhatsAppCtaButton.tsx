'use client';

import { tagWhatsAppLinkForAds, trackWhatsAppConversion } from '@/lib/gtag-client';

export function WhatsAppCtaButton({
  href,
  className,
  children = 'Consultar por WhatsApp',
}: {
  href: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        tagWhatsAppLinkForAds(event.currentTarget);
        trackWhatsAppConversion();
      }}
      className={
        className ??
        'inline-flex items-center justify-center gap-2 rounded-full bg-brand-green-dark px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-forest'
      }
    >
      {children}
    </a>
  );
}
