'use client';

import { useState, useSyncExternalStore } from 'react';
import { primaryButtonClass, secondaryButtonClass } from '@/components/admin/ui';

const subscribeNothing = () => () => {};

/** El navegador puede pasarle un archivo a otra app (WhatsApp, mail…): celulares y Chrome/Edge de escritorio. */
function canShareFiles() {
  try {
    return (
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [new File(['%PDF'], 'prueba.pdf', { type: 'application/pdf' })] })
    );
  } catch {
    return false;
  }
}

export function SaleReceiptActions({
  pdfUrl,
  fileName,
  shareText,
  whatsappUrl,
}: {
  pdfUrl: string;
  fileName: string;
  shareText: string;
  /** Chat con el cliente, si se cargó su celular. */
  whatsappUrl: string | null;
}) {
  const shareSupported = useSyncExternalStore(subscribeNothing, canShareFiles, () => false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');

  const share = async () => {
    setSharing(true);
    setError('');
    try {
      const response = await fetch(pdfUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error(String(response.status));
      const file = new File([await response.blob()], fileName, { type: 'application/pdf' });
      await navigator.share({ files: [file], text: shareText });
    } catch (shareError) {
      // Cerrar el menú de compartir sin elegir nada no es un error.
      if (!(shareError instanceof DOMException && shareError.name === 'AbortError')) {
        setError('No se pudo compartir. Descargalo y mandalo como archivo.');
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {shareSupported ? (
          <button type="button" onClick={share} disabled={sharing} className={primaryButtonClass}>
            {sharing ? 'Preparando…' : 'Compartir comprobante'}
          </button>
        ) : null}
        <a href={pdfUrl} download={fileName} className={shareSupported ? secondaryButtonClass : primaryButtonClass}>
          Descargar PDF
        </a>
        <a href={`${pdfUrl}?ver=1`} target="_blank" rel="noopener noreferrer" className={secondaryButtonClass}>
          Ver
        </a>
        {whatsappUrl ? (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={secondaryButtonClass}>
            Abrir chat del cliente
          </a>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-gray-500">
        {shareSupported
          ? '“Compartir” abre WhatsApp (u otra app) con el PDF ya adjunto.'
          : 'WhatsApp no deja adjuntar archivos desde un link: descargá el PDF y mandalo como documento en el chat.'}
      </p>
    </div>
  );
}
