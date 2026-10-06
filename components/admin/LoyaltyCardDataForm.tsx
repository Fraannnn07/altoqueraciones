'use client';

import { useActionState } from 'react';
import { updateLoyaltyCardAction, type CardDataState } from '@/app/admin/fidelidad/actions';
import { submitWithoutReset } from '@/components/admin/submit-without-reset';
import { inputClass, labelClass, primaryButtonClass } from '@/components/admin/ui';

export function LoyaltyCardDataForm({ id, name, phone }: { id: string; name: string; phone: string }) {
  const [state, formAction, pending] = useActionState<CardDataState, FormData>(updateLoyaltyCardAction, {});

  return (
    <form onSubmit={submitWithoutReset(formAction)} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="card_name" className={labelClass}>
            Nombre
          </label>
          <input
            id="card_name"
            name="name"
            required
            minLength={2}
            maxLength={60}
            defaultValue={name}
            autoComplete="off"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="card_phone" className={labelClass}>
            Celular
          </label>
          <input
            id="card_phone"
            name="phone"
            required
            inputMode="tel"
            defaultValue={phone}
            autoComplete="off"
            className={inputClass}
          />
        </div>
      </div>
      {state.error ? (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="rounded-lg bg-brand-green-light p-3 text-sm font-semibold text-brand-green-dark">
          Datos guardados.
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? 'Guardando…' : 'Guardar datos'}
      </button>
    </form>
  );
}
