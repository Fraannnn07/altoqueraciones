'use client';

import { useActionState, useState } from 'react';
import { saveDiscountRoundingAction, type DiscountFormState } from '@/app/admin/descuentos/actions';
import { hintClass, primaryButtonClass } from '@/components/admin/ui';
import { submitWithoutReset } from '@/components/admin/submit-without-reset';
import { formatUyu } from '@/lib/format';
import { applyDiscount } from '@/lib/pricing';

const EXAMPLE_PRICE = 2490;
const EXAMPLE_PERCENT = 15;

export function DiscountRoundingForm({ initial }: { initial: boolean }) {
  const [state, formAction, pending] = useActionState<DiscountFormState, FormData>(saveDiscountRoundingAction, {});
  const [roundToTen, setRoundToTen] = useState(initial);

  return (
    <form onSubmit={submitWithoutReset(formAction)} className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        <input
          type="checkbox"
          name="round_to_ten"
          checked={roundToTen}
          onChange={(event) => setRoundToTen(event.target.checked)}
        />
        Redondear los precios con descuento a la decena
      </label>
      <p className={hintClass}>
        Vale para el descuento general y para los de cada producto. Redondea para abajo, así el descuento nunca es menor
        al que se anuncia. Ej.: {formatUyu(EXAMPLE_PRICE)} con {EXAMPLE_PERCENT}% queda en{' '}
        <strong>{formatUyu(applyDiscount(EXAMPLE_PRICE, EXAMPLE_PERCENT, roundToTen))}</strong>
        {roundToTen
          ? ` (sin redondeo sería ${formatUyu(applyDiscount(EXAMPLE_PRICE, EXAMPLE_PERCENT, false))}).`
          : ` (con redondeo sería ${formatUyu(applyDiscount(EXAMPLE_PRICE, EXAMPLE_PERCENT, true))}).`}
      </p>

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

      <button type="submit" disabled={pending || roundToTen === initial} className={primaryButtonClass}>
        {pending ? 'Guardando…' : 'Guardar redondeo'}
      </button>
    </form>
  );
}
