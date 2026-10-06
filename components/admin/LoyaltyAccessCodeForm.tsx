'use client';

import { useActionState } from 'react';
import { newAccessCodeAction, type AccessCodeState } from '@/app/admin/fidelidad/actions';
import { ConfirmSubmitButton } from '@/components/admin/ConfirmSubmitButton';
import { LoyaltyAccessCode } from '@/components/admin/LoyaltyAccessCode';
import { primaryButtonClass, secondaryButtonClass } from '@/components/admin/ui';

export function LoyaltyAccessCodeForm({ id, hasCode }: { id: string; hasCode: boolean }) {
  const [state, formAction, pending] = useActionState<AccessCodeState, FormData>(newAccessCodeAction, {});

  return (
    <div className="space-y-3">
      <form action={formAction}>
        <input type="hidden" name="id" value={id} />
        {hasCode ? (
          <ConfirmSubmitButton
            message="El código anterior deja de funcionar y el cliente tiene que volver a entrar con el nuevo. ¿Generar uno nuevo?"
            className={secondaryButtonClass}
          >
            {pending ? 'Generando…' : 'Generar código nuevo'}
          </ConfirmSubmitButton>
        ) : (
          <button type="submit" disabled={pending} className={primaryButtonClass}>
            {pending ? 'Generando…' : 'Generar código de acceso'}
          </button>
        )}
      </form>
      {state.error ? (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.generated ? <LoyaltyAccessCode access={state.generated} title="Código nuevo generado." /> : null}
    </div>
  );
}
