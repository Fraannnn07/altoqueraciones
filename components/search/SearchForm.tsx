import Form from 'next/form';
import type { FormEvent } from 'react';
import { SEARCH_QUERY_MAX_LENGTH } from '@/lib/search';

const sizes = {
  // Menos de 16px de letra hace que iOS agrande la página al tocar el campo: "compact" es solo para escritorio.
  compact: { input: 'h-10 pl-4 pr-10 text-sm', button: 'w-10' },
  regular: { input: 'h-12 pl-5 pr-12 text-base', button: 'w-12' },
};

export function SearchIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="2" />
      <path d="M12.5 12.5L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Campo de búsqueda: navega a /buscar/?q=… (con JS, sin recargar la página; sin JS, como un form común).
 * El parámetro se llama `q` porque es uno de los que la medición mejorada de GA4 reconoce como búsqueda.
 */
export function SearchForm({
  defaultValue,
  autoFocus,
  size = 'regular',
  placeholder = 'Buscá por marca, tipo o kilos',
  className = '',
  onSubmit,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
  size?: keyof typeof sizes;
  placeholder?: string;
  className?: string;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const styles = sizes[size];

  return (
    <Form action="/buscar/" role="search" onSubmit={onSubmit} className={`relative ${className}`}>
      <input
        type="search"
        name="q"
        required
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        maxLength={SEARCH_QUERY_MAX_LENGTH}
        placeholder={placeholder}
        aria-label="Buscar productos"
        autoComplete="off"
        enterKeyHint="search"
        className={`w-full rounded-full border border-black/10 bg-white text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 ${styles.input}`}
      />
      <button
        type="submit"
        aria-label="Buscar"
        className={`absolute inset-y-0 right-0 flex items-center justify-center rounded-full text-gray-500 transition hover:text-brand-green-dark ${styles.button}`}
      >
        <SearchIcon />
      </button>
    </Form>
  );
}
