import Link from 'next/link';
import { WhatsAppCtaButton } from '@/components/commerce/WhatsAppCtaButton';
import { buildGeneralWhatsAppUrl } from '@/lib/whatsapp';

export default function NotFound() {
  const whatsappUrl = buildGeneralWhatsAppUrl('Hola, no encontré lo que buscaba en la web, ¿me ayudan?');

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-bold text-gray-900">Página no encontrada</h1>
      <p className="mt-4 text-gray-600">
        La página que buscás no existe o cambió de dirección. Volvé al inicio o escribinos por WhatsApp y te
        ayudamos a encontrar lo que necesitás.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="rounded-full border border-brand-green-dark px-6 py-3 text-sm font-bold text-brand-green-dark transition hover:bg-brand-green-light"
        >
          Volver al inicio
        </Link>
        <WhatsAppCtaButton href={whatsappUrl} />
      </div>
    </div>
  );
}
