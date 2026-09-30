'use client';

import { useActionState, useState, useTransition } from 'react';
import {
  applyPriceChangeAction,
  undoPriceChangeAction,
  type PriceChange,
  type PriceChangeState,
  type UndoPriceChangeResult,
} from '@/app/admin/precios/actions';
import { hintClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '@/components/admin/ui';
import { formatUyu } from '@/lib/format';
import { MAX_PRICE_CHANGE_PERCENT, PRICE_ROUNDING_STEPS, changePrice, parsePriceChangePercent } from '@/lib/pricing';

export interface PriceProduct {
  id: number;
  name: string;
  presentation: string;
  brandName: string;
  price_uyu: number;
  active: boolean;
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const roundingLabels: Record<(typeof PRICE_ROUNDING_STEPS)[number], string> = {
  1: 'Al peso (ej.: $ 2.835)',
  10: 'A la decena (ej.: $ 2.840)',
  50: 'A $ 50 (ej.: $ 2.850)',
  100: 'A $ 100 (ej.: $ 2.800)',
};

export function PriceChangeForm({ products }: { products: PriceProduct[] }) {
  const [percent, setPercent] = useState('');
  const [state, formAction, pending] = useActionState<PriceChangeState, FormData>(async (prev, formData) => {
    const result = await applyPriceChangeAction(prev, formData);
    // Se vacía el porcentaje para que un segundo clic no lo aplique dos veces.
    if (result.changes?.length) setPercent('');
    return result;
  }, {});
  const [rounding, setRounding] = useState('10');
  const [brand, setBrand] = useState('');
  const [query, setQuery] = useState('');
  const [excluded, setExcluded] = useState<Set<number>>(() => new Set());
  const [undo, setUndo] = useState<{ batch: PriceChange[]; result: UndoPriceChangeResult } | null>(null);
  const [undoPending, startUndo] = useTransition();

  const brands = [...new Set(products.map((product) => product.brandName))].sort((a, b) => a.localeCompare(b, 'es'));
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const listed = products.filter((product) => {
    if (brand && product.brandName !== brand) return false;
    const haystack = normalize(`${product.brandName} ${product.name} ${product.presentation}`);
    return words.every((word) => haystack.includes(word));
  });
  const selected = listed.filter((product) => !excluded.has(product.id));

  const percentValue = parsePriceChangePercent(percent);
  const step = Number(rounding);
  const newPrice = (product: PriceProduct) =>
    percentValue === null ? null : changePrice(product.price_uyu, percentValue, step);

  const toggle = (id: number, include: boolean) =>
    setExcluded((current) => {
      const next = new Set(current);
      if (include) next.delete(id);
      else next.add(id);
      return next;
    });
  const setAllListed = (include: boolean) =>
    setExcluded((current) => {
      const next = new Set(current);
      for (const product of listed) {
        if (include) next.delete(product.id);
        else next.add(product.id);
      }
      return next;
    });

  const lastBatch = state.changes?.length ? state.changes : null;
  const undoForThisBatch = undo && undo.batch === lastBatch ? undo.result : null;
  const canApply = !pending && percentValue !== null && selected.length > 0;
  const percentLabel = percentValue === null ? '' : `${percentValue > 0 ? '+' : ''}${String(percentValue).replace('.', ',')}%`;

  return (
    <form action={formAction}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="price_percent" className={labelClass}>
            Porcentaje
          </label>
          <input
            id="price_percent"
            name="percent"
            inputMode="decimal"
            value={percent}
            onChange={(event) => setPercent(event.target.value)}
            className={inputClass}
            placeholder="Ej.: 8 para subir, -5 para bajar"
          />
          <p className={hintClass}>
            {percent.trim() !== '' && percentValue === null
              ? `Tiene que ser un número entre -${MAX_PRICE_CHANGE_PERCENT} y ${MAX_PRICE_CHANGE_PERCENT}, distinto de 0.`
              : 'Acepta decimales (7,5). Cambia el precio de lista para siempre; para promociones usá Descuentos.'}
          </p>
        </div>
        <div>
          <label htmlFor="price_rounding" className={labelClass}>
            Redondeo
          </label>
          <select
            id="price_rounding"
            name="rounding"
            value={rounding}
            onChange={(event) => setRounding(event.target.value)}
            className={inputClass}
          >
            {PRICE_ROUNDING_STEPS.map((value) => (
              <option key={value} value={value}>
                {roundingLabels[value]}
              </option>
            ))}
          </select>
          <p className={hintClass}>Ejemplos de $ 2.700 + 5%.</p>
        </div>
        <div>
          <label htmlFor="price_brand" className={labelClass}>
            Marca
          </label>
          <select id="price_brand" value={brand} onChange={(event) => setBrand(event.target.value)} className={inputClass}>
            <option value="">Todas las marcas</option>
            {brands.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="price_search" className={labelClass}>
            Buscar
          </label>
          <input
            id="price_search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={inputClass}
            placeholder="Ej.: gato, cachorro, 15kg"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-700">
        <span>
          {selected.length} de {listed.length} productos elegidos
        </span>
        <button type="button" onClick={() => setAllListed(true)} className="font-semibold text-brand-green-dark hover:underline">
          Marcar todos
        </button>
        <span aria-hidden="true">·</span>
        <button type="button" onClick={() => setAllListed(false)} className="font-semibold text-brand-green-dark hover:underline">
          Desmarcar todos
        </button>
      </div>

      {listed.length === 0 ? <p className="mt-4 text-sm text-gray-600">Ningún producto coincide con el filtro.</p> : null}

      <ul className="mt-2 divide-y divide-black/5">
        {listed.map((product) => {
          const included = !excluded.has(product.id);
          const next = newPrice(product);
          return (
            <li key={product.id}>
              <label className={`flex flex-wrap items-center gap-3 py-3 ${included ? '' : 'opacity-50'}`}>
                <input
                  type="checkbox"
                  name="ids"
                  value={product.id}
                  checked={included}
                  onChange={(event) => toggle(product.id, event.target.checked)}
                />
                <span className="min-w-0 flex-1 basis-48">
                  <span className="block text-sm font-semibold text-gray-900">
                    {product.name}{' '}
                    <span className="font-normal text-gray-500">{product.presentation ? `— ${product.presentation}` : ''}</span>
                  </span>
                  <span className="block text-xs text-gray-500">
                    {product.brandName}
                    {product.active ? '' : ' · oculto en el sitio'}
                  </span>
                </span>
                <span className="w-44 text-right text-sm tabular-nums">
                  {next !== null && included && next !== product.price_uyu ? (
                    <>
                      <span className="text-gray-500">{formatUyu(product.price_uyu)}</span>
                      <span aria-hidden="true" className="px-1 text-gray-400">→</span>
                      <span className="sr-only"> pasa a </span>
                      <span className={`font-bold ${next > product.price_uyu ? 'text-gray-900' : 'text-brand-green-dark'}`}>
                        {formatUyu(next)}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-700">{formatUyu(product.price_uyu)}</span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-0 -mx-5 -mb-5 mt-2 flex flex-wrap items-center gap-3 rounded-b-2xl border-t border-black/5 bg-white/95 px-5 py-3 backdrop-blur">
        <button
          type="submit"
          disabled={!canApply}
          className={primaryButtonClass}
          onClick={(event) => {
            const message = `¿Cambiar el precio de ${selected.length} producto${selected.length === 1 ? '' : 's'} un ${percentLabel}? Se guarda al instante en el sitio.`;
            if (!window.confirm(message)) event.preventDefault();
          }}
        >
          {pending ? 'Aplicando…' : percentValue === null ? 'Aplicar cambio' : `Aplicar ${percentLabel} a ${selected.length}`}
        </button>
        {lastBatch && !undoForThisBatch ? (
          <button
            type="button"
            disabled={undoPending}
            className={secondaryButtonClass}
            onClick={() =>
              startUndo(async () => {
                const result = await undoPriceChangeAction(lastBatch);
                setUndo({ batch: lastBatch, result });
              })
            }
          >
            {undoPending ? 'Deshaciendo…' : 'Deshacer este cambio'}
          </button>
        ) : null}

        {state.error ? (
          <p role="alert" className="w-full rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
            {state.error}
          </p>
        ) : null}
        {state.ok && !undoForThisBatch ? (
          <p role="status" className="w-full rounded-lg bg-brand-green-light p-3 text-sm font-semibold text-brand-green-dark">
            {state.message}
          </p>
        ) : null}
        {undoForThisBatch ? (
          <p
            role={undoForThisBatch.error ? 'alert' : 'status'}
            className={`w-full rounded-lg p-3 text-sm font-semibold ${
              undoForThisBatch.error ? 'bg-red-50 text-red-700' : 'bg-brand-green-light text-brand-green-dark'
            }`}
          >
            {undoForThisBatch.error ?? undoForThisBatch.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
