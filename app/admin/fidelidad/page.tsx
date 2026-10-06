import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { META_SELLOS, PREMIO, telefonoLegible } from '@/lib/fidelidad/config';
import { listarTarjetas } from '@/lib/fidelidad/db';
import { LoyaltyCreateForm } from '@/components/admin/LoyaltyCreateForm';
import { LoyaltyQrScanner } from '@/components/admin/LoyaltyQrScanner';
import { cardClass, inputClass, secondaryButtonClass } from '@/components/admin/ui';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AdminLoyaltyPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const rawQuery = (await searchParams).q;
  const query = (typeof rawQuery === 'string' ? rawQuery : '').trim().slice(0, 60);
  const cards = await listarTarjetas(query);

  // En el mostrador: buscar por celular o código y caer directo en la tarjeta.
  if (query && cards.length === 1) redirect(`/admin/fidelidad/${cards[0].id}/`);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-gray-900">Tarjetas de sellos</h1>
      <p className="mt-1 max-w-3xl text-sm text-gray-600">
        Cada compra suma un sello. Con {META_SELLOS} sellos el cliente se lleva {PREMIO}. El cliente ve su tarjeta en
        altoqueraciones.com/fidelidad/ entrando con su celular y el código de acceso que le mandás.
      </p>

      <section className={`${cardClass} mt-6 space-y-4`}>
        <LoyaltyQrScanner />
        <form action="/admin/fidelidad/" className="flex items-end gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="Nombre, celular o código ATR-…"
            aria-label="Buscar tarjeta por nombre, celular o código"
            className={`${inputClass} min-w-0 flex-1`}
          />
          <button type="submit" className={secondaryButtonClass}>
            Buscar
          </button>
        </form>
      </section>

      <details className={`${cardClass} mt-6`}>
        <summary className="cursor-pointer text-sm font-bold text-brand-green-dark">+ Asignar tarjeta nueva</summary>
        <p className="mt-2 text-sm text-gray-600">
          Se crea la tarjeta y un código de acceso para que el cliente la vea desde su celular.
        </p>
        <div className="mt-4">
          <LoyaltyCreateForm />
        </div>
      </details>

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-gray-900">
          {query ? `Resultados para “${query}”` : 'Últimas tarjetas con movimiento'}
        </h2>
        {query ? (
          <Link href="/admin/fidelidad/" className="text-sm font-semibold text-brand-green-dark hover:underline">
            Ver todas
          </Link>
        ) : null}
      </div>

      {cards.length === 0 ? (
        <p className={`${cardClass} mt-3 text-sm text-gray-600`}>
          {query ? 'No hay tarjetas que coincidan.' : 'Todavía no hay tarjetas.'}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {cards.map((card) => {
            const stamps = Math.min(card.stamps, META_SELLOS);
            return (
              <li key={card.id}>
                <Link
                  href={`/admin/fidelidad/${card.id}/`}
                  className={`${cardClass} flex items-center justify-between gap-3 py-3 transition hover:border-brand-green/40`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{card.name}</p>
                    <p className="text-sm text-gray-500">
                      {telefonoLegible(card.phone)} · {card.code}
                      {card.access_code_hash ? '' : ' · sin código de acceso'}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-sm font-bold ${
                      stamps >= META_SELLOS ? 'bg-brand-orange text-white' : 'bg-brand-green-light text-brand-green-dark'
                    }`}
                  >
                    {stamps >= META_SELLOS ? 'Premio listo' : `${stamps}/${META_SELLOS}`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
