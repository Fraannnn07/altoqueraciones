'use client';

import { useState, useTransition } from 'react';
import { stampAction, type StampResult } from '@/app/admin/fidelidad/actions';
import type { Accion } from '@/lib/fidelidad/db';

/** Sumar sello / canjear premio / quitar sello. Los datos de la tarjeta se refrescan solos al terminar. */
export function LoyaltyStampButtons({
  id,
  name,
  stamps,
  prizeReady,
}: {
  id: string;
  name: string;
  stamps: number;
  prizeReady: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<StampResult | null>(null);

  function run(action: Accion) {
    if (action === 'redeem' && !window.confirm(`¿Canjear el premio de ${name}?`)) return;
    setResult(null);
    startTransition(async () => {
      const next = await stampAction(id, action);
      setResult(next);
    });
  }

  const base =
    'h-14 w-full rounded-2xl font-display text-lg font-bold transition focus-visible:outline-none focus-visible:ring-4 disabled:opacity-50';

  return (
    <div className="space-y-3">
      {prizeReady ? (
        <button
          type="button"
          onClick={() => run('redeem')}
          disabled={pending}
          className={`${base} bg-brand-orange text-white hover:bg-brand-orange-dark focus-visible:ring-brand-orange/40`}
        >
          Canjear premio
        </button>
      ) : (
        <button
          type="button"
          onClick={() => run('stamp')}
          disabled={pending}
          className={`${base} bg-brand-forest text-brand-cream hover:bg-brand-forest-dark focus-visible:ring-brand-green/40`}
        >
          {pending ? 'Guardando…' : 'Sumar sello'}
        </button>
      )}
      <button
        type="button"
        onClick={() => run('unstamp')}
        disabled={pending || stamps === 0}
        className="w-full py-2 text-sm font-semibold text-gray-600 underline-offset-4 hover:underline disabled:no-underline disabled:opacity-40"
      >
        Me equivoqué, quitar un sello
      </button>
      {result ? (
        <p
          role={result.error ? 'alert' : 'status'}
          className={`rounded-xl px-4 py-3 text-center text-sm font-semibold ${
            result.error ? 'bg-red-50 text-red-700' : 'bg-brand-green-light text-brand-green-dark'
          }`}
        >
          {result.error ?? result.message}
        </p>
      ) : null}
    </div>
  );
}
