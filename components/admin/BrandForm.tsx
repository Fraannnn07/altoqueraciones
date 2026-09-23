'use client';

import { useActionState } from 'react';
import { saveBrandAction, type BrandFormState } from '@/app/admin/marcas/actions';
import { hintClass, inputClass, labelClass, primaryButtonClass } from '@/components/admin/ui';

export interface BrandFormInitial {
  id: number;
  name: string;
  description: string;
  meta_title: string | null;
  meta_description: string | null;
  active: boolean;
}

export function BrandForm({ initial }: { initial: BrandFormInitial | null }) {
  const [state, formAction, pending] = useActionState<BrandFormState, FormData>(saveBrandAction, {});
  const key = initial ? `brand-${initial.id}` : 'brand-new';

  return (
    <form action={formAction} className="space-y-4" key={state.ok && !initial ? 'saved' : key}>
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
      <div>
        <label className={labelClass} htmlFor={`${key}-name`}>
          Nombre
        </label>
        <input id={`${key}-name`} name="name" required defaultValue={initial?.name ?? ''} className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor={`${key}-description`}>
          Descripción (opcional)
        </label>
        <textarea
          id={`${key}-description`}
          name="description"
          rows={3}
          defaultValue={initial?.description ?? ''}
          className={inputClass}
        />
        <p className={hintClass}>Se muestra en la página de la marca. Solo datos verificables.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor={`${key}-meta_title`}>
            Título SEO (opcional)
          </label>
          <input
            id={`${key}-meta_title`}
            name="meta_title"
            maxLength={120}
            defaultValue={initial?.meta_title ?? ''}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${key}-meta_description`}>
            Meta descripción (opcional)
          </label>
          <input
            id={`${key}-meta_description`}
            name="meta_description"
            maxLength={200}
            defaultValue={initial?.meta_description ?? ''}
            className={inputClass}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-800">
        <input type="checkbox" name="active" defaultChecked={initial?.active ?? true} />
        Activa (aparece en el sitio si tiene productos)
      </label>
      {state.error ? (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.ok ? <p className="text-sm font-semibold text-brand-green-dark">Guardado.</p> : null}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? 'Guardando…' : initial ? 'Guardar marca' : 'Crear marca'}
      </button>
    </form>
  );
}
