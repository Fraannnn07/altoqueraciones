'use client';

import { useActionState, useState } from 'react';
import { saveProductCostsAction, type CostsFormState } from '@/app/admin/ventas/actions';
import { submitWithoutReset } from '@/components/admin/submit-without-reset';
import { inputClass, labelClass, primaryButtonClass } from '@/components/admin/ui';
import { formatUyu } from '@/lib/format';
import { MAX_UNIT_PRICE, marginPercent, normalizeSearchText, parsePesos } from '@/lib/sales';

export interface CostProduct {
  id: number;
  label: string;
  brandName: string;
  price: number;
  cost: number | null;
  active: boolean;
}

export function ProductCostsForm({ products }: { products: CostProduct[] }) {
  const [state, formAction, pending] = useActionState<CostsFormState, FormData>(saveProductCostsAction, {});
  const [values, setValues] = useState<Record<number, string>>(() =>
    Object.fromEntries(products.map((product) => [product.id, product.cost === null ? '' : String(product.cost)])),
  );
  const [brand, setBrand] = useState('');
  const [query, setQuery] = useState('');
  const [onlyMissing, setOnlyMissing] = useState(false);

  const brands = [...new Set(products.map((product) => product.brandName))].sort((a, b) => a.localeCompare(b, 'es'));
  const words = normalizeSearchText(query).split(' ').filter(Boolean);
  const listed = products.filter((product) => {
    if (brand && product.brandName !== brand) return false;
    if (onlyMissing && product.cost !== null) return false;
    const haystack = normalizeSearchText(product.label);
    return words.every((word) => haystack.includes(word));
  });

  const parse = (value: string) => {
    const n = parsePesos(value);
    return n !== null && (Number.isNaN(n) || n < 0 || n > MAX_UNIT_PRICE) ? undefined : n;
  };
  // Lo que cambió respecto de lo guardado; undefined = valor inválido.
  const changes = products
    .map((product) => ({ id: product.id, cost: parse(values[product.id] ?? '') }))
    .filter((change, index) => change.cost !== products[index].cost);
  const invalid = changes.some((change) => change.cost === undefined);
  const missing = products.filter((product) => product.cost === null).length;

  return (
    <form onSubmit={submitWithoutReset(formAction)}>
      <input type="hidden" name="changes" value={JSON.stringify(invalid ? [] : changes)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="costs_brand" className={labelClass}>
            Marca
          </label>
          <select id="costs_brand" value={brand} onChange={(event) => setBrand(event.target.value)} className={inputClass}>
            <option value="">Todas las marcas</option>
            {brands.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="costs_search" className={labelClass}>
            Buscar
          </label>
          <input
            id="costs_search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={inputClass}
            placeholder="Ej.: gato, cachorro, 15kg"
          />
        </div>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={onlyMissing} onChange={(event) => setOnlyMissing(event.target.checked)} />
        Solo los que no tienen costo ({missing})
      </label>

      {listed.length === 0 ? <p className="mt-4 text-sm text-gray-600">Ningún producto coincide con el filtro.</p> : null}

      <ul className="mt-2 divide-y divide-black/5">
        {listed.map((product) => {
          const cost = parse(values[product.id] ?? '');
          const margin = typeof cost === 'number' ? marginPercent(product.price - cost, product.price) : null;
          return (
            <li key={product.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="min-w-0 flex-1 basis-56">
                <span className="block text-sm font-semibold text-gray-900">{product.label}</span>
                <span className="block text-xs text-gray-500">
                  Precio hoy {formatUyu(product.price)}
                  {product.active ? '' : ' · oculto en el sitio'}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="w-16 text-right text-xs tabular-nums text-gray-500">
                  {cost === undefined ? (
                    <span className="font-semibold text-red-700">inválido</span>
                  ) : margin !== null ? (
                    `margen ${margin}%`
                  ) : (
                    ''
                  )}
                </span>
                <label htmlFor={`cost_${product.id}`} className="sr-only">
                  Costo de {product.label}
                </label>
                <input
                  id={`cost_${product.id}`}
                  inputMode="numeric"
                  value={values[product.id] ?? ''}
                  onChange={(event) => setValues((current) => ({ ...current, [product.id]: event.target.value }))}
                  placeholder="Costo $"
                  className={`${inputClass} mt-0 w-28 text-right tabular-nums`}
                />
              </span>
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-0 -mx-5 -mb-5 mt-2 flex flex-wrap items-center gap-3 rounded-b-2xl border-t border-black/5 bg-white/95 px-5 py-3 backdrop-blur">
        <button type="submit" disabled={pending || invalid || changes.length === 0} className={primaryButtonClass}>
          {pending
            ? 'Guardando…'
            : changes.length === 0
              ? 'Sin cambios'
              : `Guardar ${changes.length} ${changes.length === 1 ? 'costo' : 'costos'}`}
        </button>
        {invalid ? <p className="text-sm font-semibold text-red-700">Hay un costo que no es un número.</p> : null}
        {state.error ? (
          <p role="alert" className="w-full rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
            {state.error}
          </p>
        ) : null}
        {state.message && changes.length === 0 ? (
          <p role="status" className="w-full rounded-lg bg-brand-green-light p-3 text-sm font-semibold text-brand-green-dark">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
