import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { bloqueadaHasta } from '@/lib/fidelidad/acceso';
import { META_SELLOS, SITE_URL, estadoTexto, telefonoLegible, whatsappCliente } from '@/lib/fidelidad/config';
import { eventosDeTarjeta, tarjetaPorId, type Accion } from '@/lib/fidelidad/db';
import { googleConfigurado } from '@/lib/fidelidad/google';
import { deleteLoyaltyCardAction } from '../actions';
import { ConfirmSubmitButton } from '@/components/admin/ConfirmSubmitButton';
import { LoyaltyAccessCodeForm } from '@/components/admin/LoyaltyAccessCodeForm';
import { LoyaltyCardDataForm } from '@/components/admin/LoyaltyCardDataForm';
import { LoyaltyStampButtons } from '@/components/admin/LoyaltyStampButtons';
import { cardClass, dangerButtonClass, hintClass, secondaryButtonClass } from '@/components/admin/ui';

const EVENT_LABELS: Record<Accion, string> = {
  stamp: 'Sello sumado',
  unstamp: 'Sello quitado',
  redeem: 'Premio canjeado',
};

const dateFormatter = new Intl.DateTimeFormat('es-UY', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Montevideo',
});
const timeFormatter = new Intl.DateTimeFormat('es-UY', { timeStyle: 'short', timeZone: 'America/Montevideo' });

export default async function AdminLoyaltyCardPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const card = await tarjetaPorId(id);
  if (!card) notFound();
  const events = await eventosDeTarjeta(card.id);

  const stamps = Math.min(card.stamps, META_SELLOS);
  const prizeReady = card.stamps >= META_SELLOS;
  const blockedUntil = bloqueadaHasta(card);

  const googleLink = `${SITE_URL}/api/wallet/google/${card.id}/`;
  const googleWhatsApp = whatsappCliente(
    card.phone,
    `¡Hola ${card.name.split(' ')[0]}! Con este link guardás tu tarjeta de sellos en Google Wallet: ${googleLink}`,
  );

  return (
    <div className="space-y-6">
      <Link href="/admin/fidelidad/" className="text-sm font-semibold text-brand-green-dark hover:underline">
        ← Tarjetas
      </Link>

      <section className={cardClass}>
        <h1 className="font-display text-2xl font-bold text-gray-900">{card.name}</h1>
        <p className="text-sm text-gray-600">
          {telefonoLegible(card.phone)} · {card.code}
          {card.rewards_redeemed > 0
            ? ` · ${card.rewards_redeemed} premio${card.rewards_redeemed === 1 ? '' : 's'} canjeado${card.rewards_redeemed === 1 ? '' : 's'}`
            : ''}
        </p>
        <div className="mx-auto mt-4 max-w-md">
          <img
            src={`/api/wallet/strip/${META_SELLOS}/${stamps}/`}
            alt={`${stamps} de ${META_SELLOS} sellos`}
            width={1032}
            height={336}
            className="w-full rounded-xl"
          />
          <p
            className={`mb-4 mt-3 text-center font-display text-lg font-bold ${
              prizeReady ? 'text-brand-orange-dark' : 'text-brand-forest-dark'
            }`}
          >
            {stamps}/{META_SELLOS} · {estadoTexto(stamps)}
          </p>
          <LoyaltyStampButtons id={card.id} name={card.name} stamps={stamps} prizeReady={prizeReady} />
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="font-display text-lg font-bold text-gray-900">Acceso del cliente</h2>
        <p className="mt-1 text-sm text-gray-600">
          {card.access_code_hash
            ? 'El cliente entra a altoqueraciones.com/fidelidad/ con su celular y su código. Si lo perdió, generá uno nuevo y mandáselo.'
            : 'Esta tarjeta todavía no tiene código de acceso: generalo y mandáselo para que pueda verla.'}
        </p>
        {blockedUntil ? (
          <p className="mt-2 rounded-lg bg-brand-orange-light p-3 text-sm text-gray-800">
            Bloqueada por intentos fallidos hasta las {timeFormatter.format(blockedUntil)}. Generar un
            código nuevo la desbloquea.
          </p>
        ) : null}
        <div className="mt-4">
          <LoyaltyAccessCodeForm id={card.id} hasCode={Boolean(card.access_code_hash)} />
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="font-display text-lg font-bold text-gray-900">Google Wallet</h2>
        {googleConfigurado() ? (
          <>
            <p className="mt-1 text-sm text-gray-600">
              Con este link el cliente guarda la tarjeta en Google Wallet y los sellos se actualizan solos.
            </p>
            <p className="mt-3 break-all rounded-lg bg-gray-50 p-3 font-mono text-xs text-gray-700">{googleLink}</p>
            <a
              href={googleWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className={`${secondaryButtonClass} mt-3`}
            >
              Enviar link por WhatsApp
            </a>
          </>
        ) : (
          <p className={hintClass}>
            Todavía no está configurado (falta cargar GOOGLE_WALLET_SA_B64 en Vercel). Cuando esté, acá aparece el link
            para mandárselo al cliente.
          </p>
        )}
      </section>

      <section className={cardClass}>
        <h2 className="font-display text-lg font-bold text-gray-900">Datos</h2>
        <div className="mt-4">
          <LoyaltyCardDataForm id={card.id} name={card.name} phone={card.phone} />
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="font-display text-lg font-bold text-gray-900">Historial</h2>
        {events.length === 0 ? (
          <p className="mt-2 text-sm text-gray-600">Todavía no tiene movimientos.</p>
        ) : (
          <ul className="mt-3 divide-y divide-black/5 text-sm">
            {events.map((event) => (
              <li key={event.id} className="flex justify-between gap-3 py-2">
                <span className="text-gray-900">
                  {EVENT_LABELS[event.kind]}{' '}
                  <span className="text-gray-500">
                    · quedó en {Math.min(event.stamps_after, META_SELLOS)}/{META_SELLOS}
                  </span>
                </span>
                <span className="shrink-0 text-gray-500">{dateFormatter.format(new Date(event.created_at))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={deleteLoyaltyCardAction}>
        <input type="hidden" name="id" value={card.id} />
        <ConfirmSubmitButton
          message={`¿Borrar la tarjeta de ${card.name}? Se pierden sus sellos y su historial.`}
          className={dangerButtonClass}
        >
          Borrar tarjeta
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
