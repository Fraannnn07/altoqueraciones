import type { Metadata } from "next";
import { tarjetaDeSesion } from "@/lib/fidelidad/acceso";
import { META_SELLOS, PREMIO } from "@/lib/fidelidad/config";
import { buildGeneralWhatsAppUrl } from "@/lib/whatsapp";
import IngresoForm from "./IngresoForm";
import MiTarjeta from "./MiTarjeta";

export const metadata: Metadata = {
  title: "Tarjeta de sellos | Al Toque Raciones",
  description: `Cada compra suma un sello. Con ${META_SELLOS} sellos: ${PREMIO}.`,
};

// Con sesión muestra la tarjeta del cliente; sin sesión, qué es y el ingreso con celular + código.
export default async function FidelidadPage() {
  const tarjeta = await tarjetaDeSesion();
  if (tarjeta) return <MiTarjeta tarjeta={tarjeta} />;

  const ejemplo = Math.min(3, META_SELLOS - 1);
  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-8">
      <div className="overflow-hidden rounded-3xl bg-brand-forest shadow-lg">
        <p className="px-5 pt-4 font-display text-sm font-bold text-brand-cream">Al Toque Raciones</p>
        <img
          src={`/api/wallet/strip/${META_SELLOS}/${ejemplo}/`}
          alt={`Ejemplo: tarjeta con ${ejemplo} de ${META_SELLOS} sellos`}
          className="mt-3 block w-full"
          width={1032}
          height={336}
        />
        <p className="px-5 py-4 text-sm text-brand-cream/90">Así se ve tu tarjeta</p>
      </div>

      <h1 className="mt-8 font-display text-3xl font-bold leading-tight text-brand-forest-dark">
        Cada compra suma una huella
      </h1>
      <p className="mt-3 text-base leading-relaxed text-gray-700">
        Con {META_SELLOS} huellas te llevás {PREMIO}. Tu tarjeta queda en el celular, así que no hay cartón que perder.
      </p>

      <h2 className="mt-8 font-display text-xl font-bold text-brand-forest-dark">Entrá a tu tarjeta</h2>
      <p className="mt-1 text-sm text-gray-600">Con tu celular y el código que te mandamos por WhatsApp.</p>
      <IngresoForm />

      <p className="mt-6 text-sm text-gray-600">
        ¿Todavía no tenés tarjeta o perdiste el código?{" "}
        <a
          href={buildGeneralWhatsAppUrl("Hola, quiero mi tarjeta de sellos.")}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand-green-dark underline underline-offset-2"
        >
          Pedila por WhatsApp
        </a>{" "}
        o en tu próxima compra.
      </p>
    </div>
  );
}
