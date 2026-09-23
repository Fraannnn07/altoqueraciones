'use client';

import { useActionState, useState } from 'react';
import { saveProductAction, type ProductFormState } from '@/app/admin/productos/actions';
import { cardClass, hintClass, inputClass, labelClass, primaryButtonClass } from '@/components/admin/ui';
import { formatPricePerKg } from '@/lib/format';

export interface ProductFormInitial {
  id: number;
  slug: string;
  name: string;
  brand_id: number;
  category_id: number;
  presentation: string;
  net_weight_kg: number | null;
  price_uyu: number;
  short_description: string;
  long_description: string;
  benefits: string[];
  characteristics: string[];
  stock_status: 'in_stock' | 'out_of_stock';
  sku: string | null;
  meta_title: string | null;
  meta_description: string | null;
  sort_order: number;
  active: boolean;
  featured: boolean;
}

interface Props {
  initial: ProductFormInitial | null;
  brands: { id: number; name: string }[];
  categories: { id: number; label: string }[];
}

export function ProductForm({ initial, brands, categories }: Props) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(saveProductAction, {});
  const values = state.values;

  // Tras un error, el servidor devuelve lo enviado para no perder lo que se escribió.
  const text = (key: string, fallback: string | number | null | undefined) =>
    values ? (values[key] ?? '') : String(fallback ?? '');
  const flag = (key: string, fallback: boolean) => (values ? values[key] === 'on' : fallback);

  const [brandChoice, setBrandChoice] = useState<string>(
    values?.brand_id ?? (initial ? String(initial.brand_id) : brands.length > 0 ? '' : 'new'),
  );
  const [price, setPrice] = useState(text('price_uyu', initial?.price_uyu));
  const [kg, setKg] = useState(text('net_weight_kg', initial?.net_weight_kg));

  const priceNumber = Number(price.replace(/[$\s.]/g, ''));
  const kgNumber = Number(kg.replace(',', '.'));
  const perKgPreview =
    price !== '' && kg !== '' && Number.isFinite(priceNumber) && Number.isFinite(kgNumber)
      ? formatPricePerKg(priceNumber, kgNumber)
      : null;

  return (
    <form action={formAction} className="space-y-6">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      <section className={cardClass}>
        <h2 className="font-display text-lg font-bold text-gray-900">Datos básicos</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className={labelClass}>
              Nombre del producto
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={text('name', initial?.name)}
              className={inputClass}
              placeholder="Ej.: Equilibrio de Pollo"
            />
          </div>

          <div>
            <label htmlFor="brand_id" className={labelClass}>
              Marca
            </label>
            <select
              id="brand_id"
              name="brand_id"
              required
              value={brandChoice}
              onChange={(event) => setBrandChoice(event.target.value)}
              className={inputClass}
            >
              <option value="" disabled>
                Elegí una marca…
              </option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
              <option value="new">+ Marca nueva…</option>
            </select>
            {brandChoice === 'new' ? (
              <input
                name="new_brand_name"
                defaultValue={text('new_brand_name', '')}
                className={inputClass}
                placeholder="Nombre de la marca nueva"
                required
              />
            ) : null}
          </div>

          <div>
            <label htmlFor="category_id" className={labelClass}>
              Categoría
            </label>
            <select
              id="category_id"
              name="category_id"
              required
              defaultValue={text('category_id', initial?.category_id ?? '')}
              className={inputClass}
            >
              <option value="" disabled>
                Elegí una categoría…
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
            <p className={hintClass}>Si no hay una subcategoría segura (adultos, cachorros…), elegí la categoría general.</p>
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="font-display text-lg font-bold text-gray-900">Presentación y precio</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="presentation" className={labelClass}>
              Presentación
            </label>
            <input
              id="presentation"
              name="presentation"
              defaultValue={text('presentation', initial?.presentation)}
              className={inputClass}
              placeholder="Ej.: Combo 22+9 kg, o 15 kg"
            />
          </div>
          <div>
            <label htmlFor="net_weight_kg" className={labelClass}>
              Kilos totales
            </label>
            <input
              id="net_weight_kg"
              name="net_weight_kg"
              inputMode="decimal"
              value={kg}
              onChange={(event) => setKg(event.target.value)}
              className={inputClass}
              placeholder="Ej.: 31"
            />
            <p className={hintClass}>En un combo, la suma de las bolsas (22+9 = 31). Se usa para el precio por kilo.</p>
          </div>
          <div>
            <label htmlFor="price_uyu" className={labelClass}>
              Precio (UYU)
            </label>
            <input
              id="price_uyu"
              name="price_uyu"
              required
              inputMode="numeric"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className={inputClass}
              placeholder="Ej.: 2700"
            />
            {perKgPreview ? <p className={hintClass}>Precio por kilo: {perKgPreview}</p> : null}
          </div>
          <div>
            <label htmlFor="stock_status" className={labelClass}>
              Disponibilidad
            </label>
            <select
              id="stock_status"
              name="stock_status"
              defaultValue={text('stock_status', initial?.stock_status ?? 'in_stock')}
              className={inputClass}
            >
              <option value="in_stock">En stock</option>
              <option value="out_of_stock">Sin stock</option>
            </select>
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="font-display text-lg font-bold text-gray-900">Descripción</h2>
        <p className={hintClass}>Solo datos verificables: no inventes beneficios, ingredientes ni certificaciones.</p>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="short_description" className={labelClass}>
              Descripción corta
            </label>
            <textarea
              id="short_description"
              name="short_description"
              rows={2}
              maxLength={300}
              defaultValue={text('short_description', initial?.short_description)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="long_description" className={labelClass}>
              Descripción larga (opcional)
            </label>
            <textarea
              id="long_description"
              name="long_description"
              rows={5}
              defaultValue={text('long_description', initial?.long_description)}
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="benefits" className={labelClass}>
                Beneficios (uno por línea, opcional)
              </label>
              <textarea
                id="benefits"
                name="benefits"
                rows={4}
                defaultValue={text('benefits', initial?.benefits.join('\n'))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="characteristics" className={labelClass}>
                Características (una por línea, opcional)
              </label>
              <textarea
                id="characteristics"
                name="characteristics"
                rows={4}
                defaultValue={text('characteristics', initial?.characteristics.join('\n'))}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="font-display text-lg font-bold text-gray-900">Publicación y SEO</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {initial ? (
            <div className="sm:col-span-2">
              <label htmlFor="slug" className={labelClass}>
                Dirección (slug)
              </label>
              <input id="slug" name="slug" defaultValue={text('slug', initial.slug)} className={inputClass} />
              <p className={hintClass}>
                Si la cambiás, la dirección vieja redirige sola a la nueva. Se ve como /producto/{initial.slug}/
              </p>
            </div>
          ) : null}
          <div>
            <label htmlFor="meta_title" className={labelClass}>
              Título SEO (opcional)
            </label>
            <input
              id="meta_title"
              name="meta_title"
              maxLength={120}
              defaultValue={text('meta_title', initial?.meta_title)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="sku" className={labelClass}>
              SKU (opcional)
            </label>
            <input id="sku" name="sku" defaultValue={text('sku', initial?.sku)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="meta_description" className={labelClass}>
              Meta descripción (opcional)
            </label>
            <textarea
              id="meta_description"
              name="meta_description"
              rows={2}
              maxLength={200}
              defaultValue={text('meta_description', initial?.meta_description)}
              className={inputClass}
            />
            <p className={hintClass}>Si la dejás vacía, se usa la descripción corta.</p>
          </div>
          <div>
            <label htmlFor="sort_order" className={labelClass}>
              Orden
            </label>
            <input
              id="sort_order"
              name="sort_order"
              inputMode="numeric"
              defaultValue={text('sort_order', initial?.sort_order ?? 0)}
              className={inputClass}
            />
            <p className={hintClass}>Menor número aparece primero.</p>
          </div>
          <div className="flex flex-col justify-end gap-2 pb-1">
            <label className="flex items-center gap-2 text-sm text-gray-800">
              <input type="checkbox" name="active" defaultChecked={flag('active', initial?.active ?? true)} />
              Visible en el sitio
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-800">
              <input type="checkbox" name="featured" defaultChecked={flag('featured', initial?.featured ?? true)} />
              Destacado en el inicio
            </label>
          </div>
        </div>
      </section>

      {state.error ? (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="rounded-lg bg-brand-green-light p-3 text-sm font-semibold text-brand-green-dark">
          Guardado. Los cambios ya están en el sitio.
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear producto'}
        </button>
        {!initial ? <p className="text-xs text-gray-500">Después de crearlo vas a poder cargar las fotos.</p> : null}
      </div>
    </form>
  );
}
