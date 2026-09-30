'use client';

import { useActionState, useState } from 'react';
import { saveSiteDiscountAction, type DiscountFormState } from '@/app/admin/descuentos/actions';
import { hintClass, inputClass, labelClass, primaryButtonClass } from '@/components/admin/ui';
import { MAX_DISCOUNT_PERCENT, siteDiscountMessage } from '@/lib/pricing';

export function SiteDiscountForm({ initial }: { initial: { active: boolean; percent: number; message: string } }) {
  const [state, formAction, pending] = useActionState<DiscountFormState, FormData>(saveSiteDiscountAction, {});
  // Campos controlados: el reset automático del formulario tras guardar no pisa lo que se ve.
  const [active, setActive] = useState(initial.active);
  const [percent, setPercent] = useState(initial.percent > 0 ? String(initial.percent) : '');
  const [message, setMessage] = useState(initial.message);

  const percentNumber = Number(percent);
  const previewPercent = Number.isInteger(percentNumber) && percentNumber > 0 ? percentNumber : 10;
  const preview = siteDiscountMessage(previewPercent, message);

  return (
    <form action={formAction} className="space-y-4">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        <input type="checkbox" name="active" checked={active} onChange={(event) => setActive(event.target.checked)} />
        Activar descuento en toda la página
      </label>

      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <div>
          <label htmlFor="site_percent" className={labelClass}>
            Descuento (%)
          </label>
          <input
            id="site_percent"
            name="percent"
            type="number"
            min={0}
            max={MAX_DISCOUNT_PERCENT}
            step={1}
            inputMode="numeric"
            value={percent}
            onChange={(event) => setPercent(event.target.value)}
            className={inputClass}
            placeholder="Ej.: 10"
          />
        </div>
        <div>
          <label htmlFor="site_message" className={labelClass}>
            Texto de la barra del inicio (opcional)
          </label>
          <input
            id="site_message"
            name="message"
            maxLength={120}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className={inputClass}
            placeholder={siteDiscountMessage(previewPercent, '')}
          />
          <p className={hintClass}>Si lo dejás vacío, se arma solo con el porcentaje.</p>
        </div>
      </div>

      <div>
        <p className={labelClass}>Así se ve la barra {active ? '' : '(cuando lo actives)'}</p>
        <div className="mt-1 overflow-hidden whitespace-nowrap rounded-lg bg-brand-sale px-3 py-1.5 text-sm font-bold text-white">
          {preview} <span className="px-4 text-white/70">•</span> {preview}
        </div>
        <p className={hintClass}>En el sitio el texto se desplaza de derecha a izquierda, arriba del menú del inicio.</p>
      </div>

      {state.error ? (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="rounded-lg bg-brand-green-light p-3 text-sm font-semibold text-brand-green-dark">
          {state.message}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? 'Guardando…' : 'Guardar descuento general'}
      </button>
    </form>
  );
}
