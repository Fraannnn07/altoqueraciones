'use client';

import { useState } from 'react';
import type { NewAccessCode } from '@/app/admin/fidelidad/actions';
import { hintClass, primaryButtonClass, secondaryButtonClass } from '@/components/admin/ui';

/** Código de acceso recién generado, con los botones para mandárselo al cliente. Se muestra una sola vez. */
export function LoyaltyAccessCode({ access, title }: { access: NewAccessCode; title: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(access.loginUrl);
      setCopied(true);
    } catch {
      window.prompt('Copiá el link:', access.loginUrl);
    }
  }

  return (
    <div role="status" className="rounded-xl border border-brand-green/30 bg-brand-green-light p-4">
      <p className="text-sm font-bold text-brand-green-dark">{title}</p>
      <p className="mt-2 text-sm text-gray-700">Código de acceso de {access.name}:</p>
      <p className="mt-1 font-mono text-3xl font-bold tracking-[0.25em] text-gray-900">{access.code}</p>
      <p className={hintClass}>
        Mandáselo ahora: por seguridad no se vuelve a mostrar. Si lo pierde, generás uno nuevo desde su tarjeta.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={access.whatsappUrl} target="_blank" rel="noopener noreferrer" className={primaryButtonClass}>
          Enviar por WhatsApp
        </a>
        <button type="button" onClick={copyLink} className={secondaryButtonClass}>
          {copied ? 'Link copiado' : 'Copiar link de ingreso'}
        </button>
      </div>
    </div>
  );
}
