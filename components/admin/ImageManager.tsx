'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import {
  deleteProductImageAction,
  setPrimaryImageAction,
  updateImageAltAction,
  uploadProductImageAction,
} from '@/app/admin/productos/actions';
import { cardClass, dangerButtonClass, hintClass, inputClass, secondaryButtonClass } from '@/components/admin/ui';

export interface ManagedImage {
  id: number;
  url: string | null;
  alt_text: string;
  is_primary: boolean;
}

const MAX_SIDE = 1600;

/** Redimensiona y convierte a WebP en el navegador: fotos livianas = sitio más rápido. */
async function compressImage(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('El navegador no pudo procesar la imagen.');
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const toBlob = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  const blob = (await toBlob('image/webp', 0.85)) ?? (await toBlob('image/jpeg', 0.88));
  if (!blob) throw new Error('No se pudo comprimir la imagen.');
  return { blob, width, height };
}

export function ImageManager({
  productId,
  defaultAlt,
  images,
}: {
  productId: number;
  defaultAlt: string;
  images: ManagedImage[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      let done = 0;
      for (const file of Array.from(files)) {
        setStatus(`Subiendo ${done + 1} de ${files.length}…`);
        const { blob, width, height } = await compressImage(file);
        const formData = new FormData();
        formData.set('productId', String(productId));
        formData.set('file', new File([blob], 'foto.webp', { type: blob.type }));
        formData.set('alt', defaultAlt);
        formData.set('width', String(width));
        formData.set('height', String(height));
        const result = await uploadProductImageAction(formData);
        if (result.error) throw new Error(result.error);
        done += 1;
      }
      setStatus(`${done} foto${done === 1 ? '' : 's'} subida${done === 1 ? '' : 's'}.`);
      router.refresh();
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function run(action: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <section className={cardClass}>
      <h2 className="font-display text-lg font-bold text-gray-900">Fotos</h2>
      <p className={hintClass}>
        Usá fotos fieles a la presentación que se vende (la bolsa o combo exacto). Se convierten a WebP y se
        achican automáticamente. La primera es la principal.
      </p>

      <div className="mt-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={uploading}
          onChange={(event) => handleFiles(event.target.files)}
          className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-green file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-brand-green-dark"
        />
        {status ? <p className="mt-2 text-sm text-brand-green-dark">{status}</p> : null}
        {error ? (
          <p role="alert" className="mt-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}
      </div>

      {images.length > 0 ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {images.map((image) => (
            <li key={image.id} className="rounded-xl border border-black/5 p-3">
              <div className="relative h-40 w-full overflow-hidden rounded-lg bg-brand-warm-gray">
                {image.url ? (
                  <Image src={image.url} alt={image.alt_text} fill sizes="240px" className="object-contain p-2" />
                ) : null}
                {image.is_primary ? (
                  <span className="absolute left-2 top-2 rounded-full bg-brand-green px-2 py-0.5 text-xs font-bold text-white">
                    Principal
                  </span>
                ) : null}
              </div>
              <label className="mt-3 block text-xs font-semibold text-gray-700" htmlFor={`alt-${image.id}`}>
                Texto alternativo
              </label>
              <input
                id={`alt-${image.id}`}
                defaultValue={image.alt_text}
                className={inputClass}
                onBlur={(event) => {
                  const value = event.target.value;
                  if (value !== image.alt_text) run(() => updateImageAltAction(productId, image.id, value));
                }}
              />
              <div className="mt-3 flex gap-2">
                {!image.is_primary ? (
                  <button
                    type="button"
                    disabled={pending}
                    className={secondaryButtonClass}
                    onClick={() => run(() => setPrimaryImageAction(productId, image.id))}
                  >
                    Hacer principal
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={pending}
                  className={dangerButtonClass}
                  onClick={() => {
                    if (window.confirm('¿Borrar esta foto?')) run(() => deleteProductImageAction(productId, image.id));
                  }}
                >
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-gray-500">Todavía no hay fotos. En el sitio se ve “Sin imagen”.</p>
      )}
    </section>
  );
}
