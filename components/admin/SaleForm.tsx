'use client';

import { useActionState, useId, useRef, useState } from 'react';
import { saveSaleAction, type SaleFormState } from '@/app/admin/ventas/actions';
import { submitWithoutReset } from '@/components/admin/submit-without-reset';
import { cardClass, hintClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '@/components/admin/ui';
import { formatUyu } from '@/lib/format';
import {
  MAX_LINE_QUANTITY,
  MAX_SALE_LINES,
  MAX_UNIT_PRICE,
  PAYMENT_METHODS,
  normalizeSearchText,
  parsePesos,
  saleTotals,
  type SaleLine,
} from '@/lib/sales';

export interface SaleFormProduct {
  id: number;
  label: string;
  price: number;
  cost: number | null;
  active: boolean;
  inStock: boolean;
}

export interface SaleFormInitial {
  id: number;
  soldAt: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  notes: string;
  discount: number;
  lines: SaleLine[];
}

interface DraftLine {
  key: string;
  productId: number | null;
  description: string;
  quantity: string;
  unitPrice: string;
  unitCost: string;
}

// Las líneas nuevas se crean solo en el navegador; las de una venta guardada usan su posición, así el
// HTML del servidor y el del navegador coinciden.
let keySeed = 0;
const newKey = () => `line-${++keySeed}`;

function toDraft(line: SaleLine, index: number): DraftLine {
  return {
    key: `saved-${index}`,
    productId: line.productId,
    description: line.description,
    quantity: String(line.quantity),
    unitPrice: String(line.unitPrice),
    unitCost: line.unitCost === null ? '' : String(line.unitCost),
  };
}

/** La línea lista para guardar, o null si le falta algo. */
function parseLine(line: DraftLine): SaleLine | null {
  const quantity = Number(line.quantity);
  const unitPrice = parsePesos(line.unitPrice);
  const unitCost = parsePesos(line.unitCost);
  if (!line.description.trim() || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) return null;
  if (unitPrice === null || Number.isNaN(unitPrice) || unitPrice < 0 || unitPrice > MAX_UNIT_PRICE) return null;
  if (unitCost !== null && (Number.isNaN(unitCost) || unitCost < 0 || unitCost > MAX_UNIT_PRICE)) return null;
  return { productId: line.productId, description: line.description.trim(), quantity, unitPrice, unitCost };
}

export function SaleForm({
  products,
  initial,
  defaultSoldAt,
}: {
  products: SaleFormProduct[];
  initial?: SaleFormInitial;
  defaultSoldAt: string;
}) {
  const [state, formAction, pending] = useActionState<SaleFormState, FormData>(saveSaleAction, {});
  const [lines, setLines] = useState<DraftLine[]>(() => (initial?.lines ?? []).map(toDraft));
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const [discountMode, setDiscountMode] = useState<'pesos' | 'percent'>('pesos');
  const [discountValue, setDiscountValue] = useState(initial?.discount ? String(initial.discount) : '');
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const words = normalizeSearchText(query).split(' ').filter(Boolean);
  const matches =
    words.length === 0
      ? []
      : products
          .filter((product) => {
            const haystack = normalizeSearchText(product.label);
            return words.every((word) => haystack.includes(word));
          })
          .slice(0, 8);

  const parsedLines = lines.map(parseLine);
  const validLines = parsedLines.filter((line): line is SaleLine => line !== null);
  const allValid = lines.length > 0 && validLines.length === lines.length;

  const subtotal = saleTotals(validLines, 0).subtotal;
  const discountInput = parsePesos(discountValue);
  const discountOk = discountInput === null || (!Number.isNaN(discountInput) && discountInput >= 0);
  const discountPesos =
    discountInput === null || !discountOk
      ? 0
      : discountMode === 'percent'
        ? Math.round((subtotal * Math.min(discountInput, 100)) / 100)
        : discountInput;
  const totals = saleTotals(validLines, discountPesos);
  const missingCosts = validLines.filter((line) => line.unitCost === null).length;

  const updateLine = (key: string, patch: Partial<DraftLine>) =>
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  const removeLine = (key: string) => setLines((current) => current.filter((line) => line.key !== key));

  const addProduct = (product: SaleFormProduct) => {
    setLines((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing) {
        return current.map((line) =>
          line === existing ? { ...line, quantity: String(Math.min((Number(line.quantity) || 0) + 1, MAX_LINE_QUANTITY)) } : line,
        );
      }
      return [
        ...current,
        {
          key: newKey(),
          productId: product.id,
          description: product.label,
          quantity: '1',
          unitPrice: String(product.price),
          unitCost: product.cost === null ? '' : String(product.cost),
        },
      ];
    });
    setQuery('');
    setHighlighted(0);
    searchRef.current?.focus();
  };

  const addFreeLine = () =>
    setLines((current) => [
      ...current,
      { key: newKey(), productId: null, description: '', quantity: '1', unitPrice: '', unitCost: '0' },
    ]);

  const canSubmit = !pending && allValid && discountOk && lines.length <= MAX_SALE_LINES;

  return (
    <form onSubmit={submitWithoutReset(formAction)} className="space-y-6">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input type="hidden" name="lines" value={JSON.stringify(validLines)} />
      <input type="hidden" name="discount_uyu" value={totals.discount} />

      <section className={cardClass}>
        <h2 className="font-display text-lg font-bold text-gray-900">Productos</h2>

        <div className="relative mt-3">
          <label htmlFor="sale_product_search" className="sr-only">
            Buscar producto para agregar
          </label>
          <input
            ref={searchRef}
            id="sale_product_search"
            type="search"
            role="combobox"
            aria-expanded={matches.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setHighlighted(0);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' && matches.length > 0) {
                event.preventDefault();
                setHighlighted((index) => (index + 1) % matches.length);
              } else if (event.key === 'ArrowUp' && matches.length > 0) {
                event.preventDefault();
                setHighlighted((index) => (index - 1 + matches.length) % matches.length);
              } else if (event.key === 'Enter') {
                // Enter agrega el producto marcado en vez de mandar el formulario.
                event.preventDefault();
                if (matches[highlighted]) addProduct(matches[highlighted]);
              } else if (event.key === 'Escape') {
                setQuery('');
              }
            }}
            placeholder="Buscar producto para agregar: marca, nombre, kilos…"
            className={inputClass}
          />
          {matches.length > 0 ? (
            <ul
              id={listId}
              role="listbox"
              className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-xl border border-black/10 bg-white py-1 shadow-lg"
            >
              {matches.map((product, index) => (
                <li
                  key={product.id}
                  role="option"
                  aria-selected={index === highlighted}
                  onMouseDown={(event) => {
                    // mousedown y no click: así el campo no pierde el foco antes de agregar.
                    event.preventDefault();
                    addProduct(product);
                  }}
                  onMouseEnter={() => setHighlighted(index)}
                  className={`flex cursor-pointer items-baseline justify-between gap-3 px-3 py-2 text-sm ${
                    index === highlighted ? 'bg-brand-green-light' : ''
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-gray-900">{product.label}</span>
                    <span className="block text-xs text-gray-500">
                      {[
                        product.active ? null : 'oculto en el sitio',
                        product.inStock ? null : 'sin stock en el sitio',
                        product.cost === null ? 'sin costo cargado' : `costo ${formatUyu(product.cost)}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-gray-900">{formatUyu(product.price)}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {words.length > 0 && matches.length === 0 ? (
            <p className={hintClass}>Ningún producto coincide. Si no está en el catálogo, agregalo como otro concepto.</p>
          ) : null}
        </div>

        {lines.length === 0 ? (
          <p className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            Buscá un producto arriba para agregarlo. Para el envío u otra cosa que no esté en el catálogo, usá “Otro
            concepto”.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-black/5">
            {lines.map((line, index) => {
              const parsed = parsedLines[index];
              return (
                <li key={line.key} className="py-3">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <label htmlFor={`${line.key}-description`} className="sr-only">
                        Descripción
                      </label>
                      <input
                        id={`${line.key}-description`}
                        value={line.description}
                        maxLength={160}
                        onChange={(event) => updateLine(line.key, { description: event.target.value })}
                        placeholder={line.productId === null ? 'Ej.: Envío' : ''}
                        className={`${inputClass} mt-0 font-semibold`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      aria-label={`Sacar ${line.description || 'esta línea'}`}
                      className="shrink-0 rounded-lg px-2.5 py-2 text-lg leading-none text-gray-400 hover:bg-red-50 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-[7rem_1fr_1fr_auto] sm:items-end">
                    <div>
                      <label htmlFor={`${line.key}-qty`} className="text-xs font-semibold text-gray-600">
                        Cantidad
                      </label>
                      <input
                        id={`${line.key}-qty`}
                        type="number"
                        min={1}
                        max={MAX_LINE_QUANTITY}
                        step={1}
                        inputMode="numeric"
                        value={line.quantity}
                        onChange={(event) => updateLine(line.key, { quantity: event.target.value })}
                        className={`${inputClass} tabular-nums`}
                      />
                    </div>
                    <div>
                      <label htmlFor={`${line.key}-price`} className="text-xs font-semibold text-gray-600">
                        Precio unitario
                      </label>
                      <input
                        id={`${line.key}-price`}
                        inputMode="numeric"
                        value={line.unitPrice}
                        onChange={(event) => updateLine(line.key, { unitPrice: event.target.value })}
                        placeholder="$"
                        className={`${inputClass} tabular-nums`}
                      />
                    </div>
                    <div>
                      <label htmlFor={`${line.key}-cost`} className="text-xs font-semibold text-gray-600">
                        Costo unitario
                      </label>
                      <input
                        id={`${line.key}-cost`}
                        inputMode="numeric"
                        value={line.unitCost}
                        onChange={(event) => updateLine(line.key, { unitCost: event.target.value })}
                        placeholder="Sin cargar"
                        className={`${inputClass} tabular-nums`}
                      />
                    </div>
                    <p className="text-right text-sm sm:min-w-24 sm:pb-2">
                      <span className="block text-xs font-semibold text-gray-600 sm:sr-only">Importe</span>
                      <span className="font-bold tabular-nums text-gray-900">
                        {parsed ? formatUyu(parsed.quantity * parsed.unitPrice) : '—'}
                      </span>
                    </p>
                  </div>
                  {parsed === null ? (
                    <p className="mt-1 text-xs font-semibold text-red-700">
                      Revisá esta línea: necesita descripción, una cantidad de 1 a {MAX_LINE_QUANTITY} y un precio.
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={addFreeLine} className={secondaryButtonClass}>
            + Otro concepto (envío, etc.)
          </button>
          <p className="text-xs text-gray-500">
            El costo es lo que te sale a vos cada unidad; se usa para la ganancia y no sale en el comprobante.
            {initial ? '' : ' En una venta nueva, queda guardado para la próxima venta de ese producto.'}
          </p>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="font-display text-lg font-bold text-gray-900">Cliente</h2>
        <p className="mt-1 text-sm text-gray-600">Opcional. Sin nombre, el comprobante sale a “Consumidor final”.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sale_customer_name" className={labelClass}>
              Nombre
            </label>
            <input
              id="sale_customer_name"
              name="customer_name"
              maxLength={80}
              autoComplete="off"
              defaultValue={initial?.customerName ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="sale_customer_phone" className={labelClass}>
              Celular
            </label>
            <input
              id="sale_customer_phone"
              name="customer_phone"
              inputMode="tel"
              autoComplete="off"
              placeholder="099 123 456"
              defaultValue={initial?.customerPhone ?? ''}
              className={inputClass}
            />
            <p className={hintClass}>Para abrirle el chat de WhatsApp y mandarle el comprobante.</p>
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="font-display text-lg font-bold text-gray-900">Pago</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sale_payment" className={labelClass}>
              Medio de pago
            </label>
            <select
              id="sale_payment"
              name="payment_method"
              defaultValue={initial?.paymentMethod ?? 'efectivo'}
              className={inputClass}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sale_sold_at" className={labelClass}>
              Fecha y hora
            </label>
            <input
              id="sale_sold_at"
              name="sold_at"
              type="datetime-local"
              required
              defaultValue={initial?.soldAt ?? defaultSoldAt}
              className={inputClass}
            />
            <p className={hintClass}>Cambiala solo si estás cargando una venta de otro día.</p>
          </div>
          <div>
            <label htmlFor="sale_discount" className={labelClass}>
              Descuento
            </label>
            <div className="mt-1 grid grid-cols-[1fr_5.5rem] gap-2">
              <input
                id="sale_discount"
                inputMode="decimal"
                value={discountValue}
                onChange={(event) => setDiscountValue(event.target.value)}
                placeholder="0"
                className={`${inputClass} mt-0 tabular-nums`}
              />
              <label htmlFor="sale_discount_mode" className="sr-only">
                Tipo de descuento
              </label>
              <select
                id="sale_discount_mode"
                value={discountMode}
                onChange={(event) => setDiscountMode(event.target.value as 'pesos' | 'percent')}
                className={`${inputClass} mt-0`}
              >
                <option value="pesos">$</option>
                <option value="percent">%</option>
              </select>
            </div>
            <p className={hintClass}>
              {discountOk
                ? discountMode === 'percent' && totals.discount > 0
                  ? `Son ${formatUyu(totals.discount)} sobre el subtotal.`
                  : 'Sobre el total de la venta. Dejalo vacío si no hay.'
                : 'Tiene que ser un número.'}
            </p>
          </div>
          <div>
            <label htmlFor="sale_notes" className={labelClass}>
              Nota
            </label>
            <textarea
              id="sale_notes"
              name="notes"
              rows={2}
              maxLength={300}
              defaultValue={initial?.notes ?? ''}
              className={inputClass}
            />
            <p className={hintClass}>Sale en el comprobante (ej.: entrega el jueves).</p>
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {totals.discount > 0 ? (
              <>
                <div>
                  <dt className="inline text-gray-500">Subtotal </dt>
                  <dd className="inline font-semibold tabular-nums">{formatUyu(totals.subtotal)}</dd>
                </div>
                <div>
                  <dt className="inline text-gray-500">Descuento </dt>
                  <dd className="inline font-semibold tabular-nums">- {formatUyu(totals.discount)}</dd>
                </div>
              </>
            ) : null}
            <div>
              <dt className="inline text-gray-500">Total </dt>
              <dd className="inline font-display text-lg font-bold tabular-nums text-gray-900">{formatUyu(totals.total)}</dd>
            </div>
            <div>
              <dt className="inline text-gray-500">Ganancia </dt>
              <dd className="inline font-semibold tabular-nums">
                {totals.profit !== null ? (
                  <span className={totals.profit < 0 ? 'text-red-700' : 'text-brand-green-dark'}>{formatUyu(totals.profit)}</span>
                ) : validLines.length > 0 ? (
                  <span className="text-gray-500">
                    falta el costo de {missingCosts} {missingCosts === 1 ? 'línea' : 'líneas'}
                  </span>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>
          <button type="submit" disabled={!canSubmit} className={primaryButtonClass}>
            {pending ? 'Guardando…' : initial ? 'Guardar cambios' : 'Guardar venta'}
          </button>
        </div>
        {state.error ? (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
            {state.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
