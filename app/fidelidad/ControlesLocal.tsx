"use client";

import { useRouter } from "next/navigation";
import type { TarjetaPublica } from "@/lib/fidelidad/publica";
import BotonesSello from "./BotonesSello";
import { borrarPin, usePinGuardado } from "./accionesCliente";

/**
 * Aparece en la página de la tarjeta solo en los celulares del local
 * (los que ya entraron una vez al panel con el PIN). El cliente no lo ve.
 */
export default function ControlesLocal({ tarjeta }: { tarjeta: TarjetaPublica }) {
  const router = useRouter();
  const pin = usePinGuardado();
  if (!pin) return null;

  return (
    <section className="mt-8 rounded-3xl border-2 border-dashed border-brand-forest/30 p-5">
      <h2 className="font-display text-lg font-bold text-brand-forest-dark">Panel del local</h2>
      <p className="mb-4 text-sm text-gray-600">
        {tarjeta.name}, {tarjeta.phone}
      </p>
      <BotonesSello tarjeta={tarjeta} pin={pin} onCambio={() => router.refresh()} onPinInvalido={borrarPin} />
    </section>
  );
}
