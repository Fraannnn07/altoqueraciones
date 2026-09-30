'use client';

import { useActionState, useState } from 'react';
import { saveProductDiscountsAction, type DiscountFormState } from '@/app/admin/descuentos/actions';
import { primaryButtonClass, secondaryButtonClass } from '@/components/admin/ui';
import { formatUyu } from '@/lib/format';
import { MAX_DISCOUNT_PERCENT, buildPricing, isOnSale, parseDiscountPercent } from '@/lib/pricing';

export interface DiscountProduct {
  id: number;
  name: string;
  presentation: string;
  brandName: string;
  price_uyu: number;
  discount_percent: number;
  active: boolean;
}

const smallInputClass =
  'w-16 rounded-lg border bg-white px-2 py-1.5 text-right text-sm text-gray-900 shadow-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30';

function normalize(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function ProductDiscountsForm({ products, sitePercent }: { products: DiscountProduct[]; sitePercent: number }) {
  const [state, formAction, pending] = useActionState<DiscountFormState, FormData>(saveProductDiscountsAction, {});
  // Campos controlados: el reset automático del formulario tras guardar no pisa lo que se ve.
  const [values, setValues] = useState<Record<number, string>>(() =>
    Object.fromEntries(products.map((product) => [product.id, String(product.discount_percent)])),
  );
  const [query, setQuery] = useState('');
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [bulkPercent, setBulkPercent] = useState('');

  const percentOf = (id: number) => parseDiscountPercent(values[id] ?? '0');
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const isVisible = (product: DiscountProduct) => {
    if (onlyDiscounted && !((percentOf(product.id) ?? 0) > 0)) return false;
    const haystack = normalize(`${product.brandName} ${product.name} ${product.presentation}`);
    return words.every((word) => haystack.includes(word));
  };

  const visible = products.filter(isVisible);
  const invalidCount = products.filter((product) => percentOf(product.id) === null).length;
  const changedCount = products.filter((product) => percentOf(product.id) !== product.discount_percent).length;
  const discountedCount = products.filter((product) => (percentOf(product.id) ?? 0) > 0).length;
  const bulkValue = parseDiscountPercent(bulkPercent);

  const setMany = (targets: DiscountProduct[], percent: string) =>
    setValues((current) => ({ ...current, ...Object.fromEntries(targets.map((product) => [product.id, percent])) }));

  return (
    // noValidate: un campo inválido puede estar oculto por el filtro y el navegador no podría mostrarlo;
    // se valida acá (borde rojo, botón deshabilitado) y de nuevo en el servidor.
    <form action={formAction} noValidate>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <label htmlFor="discount_search" className="block text-sm font-semibold text-gray-800">
            Buscar
          </label>
          <input
            id="discount_search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Marca, nombre o kilos"
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-gray-800">
          <input type="checkbox" checked={onlyDiscounted} onChange={(event) => setOnlyDiscounted(event.target.checked)} />
          Solo con descuento
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
        <span>Poner</span>
        <input
          type="number"
          min={0}
          max={MAX_DISCOUNT_PERCENT}
          step={1}
          inputMode="numeric"
          value={bulkPercent}
          onChange={(event) => setBulkPercent(event.target.value)}
          aria-label="Descuento para los productos de la lista"
          className={`${smallInputClass} border-gray-300`}
        />
        <span>% a los {visible.length} de la lista</span>
        <button
          type="button"
          disabled={bulkPercent.trim() === '' || bulkValue === null || visible.length === 0}
          onClick={() => setMany(visible, String(bulkValue))}
          className={secondaryButtonClass}
        >
          Aplicar
        </button>
        <button
          type="button"
          disabled={discountedCount === 0}
          onClick={() => setMany(products, '0')}
          className={`${secondaryButtonClass} sm:ml-auto`}
        >
          Quitar todos
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600">Ningún producto coincide con la búsqueda.</p>
      ) : null}

      <ul className="mt-2 divide-y divide-black/5">
        {products.map((product) => {
          const own = percentOf(product.id);
          const pricing = buildPricing(product.price_uyu, own ?? 0, sitePercent);
          const siteWins = sitePercent > 0 && sitePercent >= (own ?? 0);
          return (
            // Los ocultos por el filtro siguen en el formulario y se envían igual.
            <li key={product.id} hidden={!isVisible(product)} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1 basis-56">
                <p className="text-sm font-semibold text-gray-900">
                  {product.name}{' '}
                  <span className="font-normal text-gray-500">{product.presentation ? `— ${product.presentation}` : ''}</span>
                </p>
                <p className="text-xs text-gray-500">
                  {product.brandName}
                  {product.active ? '' : ' · oculto en el sitio'}
                </p>
              </div>
              <label className="flex items-center gap-1 text-sm text-gray-700">
                <span className="sr-only">Descuento de {product.name}</span>
                <input
                  name={`discount_${product.id}`}
                  type="number"
                  min={0}
                  max={MAX_DISCOUNT_PERCENT}
                  step={1}
                  inputMode="numeric"
                  value={values[product.id] ?? '0'}
                  onChange={(event) => setValues((current) => ({ ...current, [product.id]: event.target.value }))}
                  aria-invalid={own === null}
                  className={`${smallInputClass} ${own === null ? 'border-red-400' : 'border-gray-300'}`}
                />
                %
              </label>
              <div className="w-32 text-right text-sm">
                {isOnSale(pricing) ? (
                  <>
                    <s className="block text-xs text-gray-500">{formatUyu(pricing.regular)}</s>
                    <span className="font-bold text-brand-sale">{formatUyu(pricing.final)}</span>
                    {siteWins ? <span className="block text-xs text-gray-500">por el general</span> : null}
                  </>
                ) : (
                  <span className="text-gray-700">{formatUyu(pricing.regular)}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-0 -mx-5 -mb-5 mt-2 flex flex-wrap items-center gap-3 rounded-b-2xl border-t border-black/5 bg-white/95 px-5 py-3 backdrop-blur">
        <button type="submit" disabled={pending || invalidCount > 0 || changedCount === 0} className={primaryButtonClass}>
          {pending ? 'Guardando…' : 'Guardar descuentos'}
        </button>
        <p className="text-sm text-gray-600">
          {invalidCount > 0
            ? `Hay ${invalidCount} descuento${invalidCount === 1 ? '' : 's'} inválido${invalidCount === 1 ? '' : 's'} (van de 0 a ${MAX_DISCOUNT_PERCENT}, sin decimales).`
            : changedCount > 0
              ? `${changedCount} cambio${changedCount === 1 ? '' : 's'} sin guardar.`
              : `${discountedCount} producto${discountedCount === 1 ? '' : 's'} con descuento propio.`}
        </p>
        {state.error ? (
          <p role="alert" className="w-full rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
            {state.error}
          </p>
        ) : null}
        {state.ok && changedCount === 0 ? (
          <p role="status" className="w-full rounded-lg bg-brand-green-light p-3 text-sm font-semibold text-brand-green-dark">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
