'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef } from 'react';
import { createLoyaltyCardAction, type CreateCardState } from '@/app/admin/fidelidad/actions';
import { LoyaltyAccessCode } from '@/components/admin/LoyaltyAccessCode';
import { submitWithoutReset } from '@/components/admin/submit-without-reset';
import { inputClass, labelClass, primaryButtonClass } from '@/components/admin/ui';

export function LoyaltyCreateForm() {
  const [state, formAction, pending] = useActionState<CreateCardState, FormData>(createLoyaltyCardAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  // Después de cada alta el formulario se vacía; si hay error, los datos quedan para corregirlos.
  useEffect(() => {
    if (state.created) formRef.current?.reset();
  }, [state.created]);

  return (
    <div className="space-y-4">
      <form ref={formRef} onSubmit={submitWithoutReset(formAction)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="loyalty_name" className={labelClass}>
              Nombre del cliente
            </label>
            <input
              id="loyalty_name"
              name="name"
              required
              minLength={2}
              maxLength={60}
              autoComplete="off"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="loyalty_phone" className={labelClass}>
              Celular
            </label>
            <input
              id="loyalty_phone"
              name="phone"
              required
              inputMode="tel"
              autoComplete="off"
              placeholder="099 123 456"
              className={inputClass}
            />
          </div>
        </div>

        {state.error ? (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
            {state.error}{' '}
            {state.existingId ? (
              <Link href={`/admin/fidelidad/${state.existingId}/`} className="underline">
                Abrir su tarjeta
              </Link>
            ) : null}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? 'Creando…' : 'Crear tarjeta y código'}
        </button>
      </form>

      {state.created ? (
        <div className="space-y-2">
          <LoyaltyAccessCode access={state.created} title={`Tarjeta creada para ${state.created.name}.`} />
          <Link
            href={`/admin/fidelidad/${state.created.cardId}/`}
            className="inline-block text-sm font-semibold text-brand-green-dark hover:underline"
          >
            Ir a su tarjeta para sumar el primer sello →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
