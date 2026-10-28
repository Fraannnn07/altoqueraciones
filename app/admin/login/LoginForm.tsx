'use client';

import { useActionState } from 'react';
import { loginAction, type LoginState } from './actions';
import { submitWithoutReset } from '@/components/admin/submit-without-reset';
import { inputClass, labelClass, primaryButtonClass } from '@/components/admin/ui';

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    // Sin el reset de React 19: si la contraseña está mal, el usuario queda escrito.
    <form onSubmit={submitWithoutReset(formAction)} className="mt-6 space-y-4">
      <div>
        <label htmlFor="username" className={labelClass}>
          Usuario
        </label>
        <input
          id="username"
          name="username"
          required
          autoFocus
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {state.error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={`${primaryButtonClass} w-full`}>
        {pending ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  );
}
