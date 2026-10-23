'use client';

import { useEffect } from 'react';
import { rememberAdVisit } from '@/lib/gtag-client';

/** Recuerda si la visita llegó desde un anuncio de Google, para marcar el mensaje de WhatsApp. */
export function AdVisitTracker() {
  useEffect(() => {
    rememberAdVisit();
  }, []);
  return null;
}
