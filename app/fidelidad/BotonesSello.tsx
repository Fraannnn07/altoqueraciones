"use client";

import { useState } from "react";
import type { TarjetaPublica } from "@/lib/fidelidad/publica";
import { aplicar, MENSAJES, type Accion } from "./accionesCliente";

type Props = {
  tarjeta: TarjetaPublica;
  pin: string;
  onCambio: (t: TarjetaPublica) => void;
  onPinInvalido?: () => void;
};

/** Botones del local: sumar, quitar y canjear. */
export default function BotonesSello({ tarjeta, pin, onCambio, onPinInvalido }: Props) {
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  async function hacer(accion: Accion) {
    if (accion === "redeem" && !confirm(`¿Canjear el premio de ${tarjeta.name}?`)) return;
    setOcupado(true);
    setAviso(null);
    try {
      const t = await aplicar(tarjeta.id, accion, pin);
      onCambio(t);
      setAviso({ ok: true, texto: MENSAJES[accion](t) });
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) onPinInvalido?.();
      setAviso({ ok: false, texto: err.message });
    } finally {
      setOcupado(false);
    }
  }

  const base =
    "h-14 rounded-2xl font-display text-lg font-bold transition focus-visible:outline-none focus-visible:ring-4 disabled:opacity-50";

  return (
    <div className="space-y-3">
      {tarjeta.premioListo ? (
        <button
          onClick={() => hacer("redeem")}
          disabled={ocupado}
          className={`${base} w-full bg-brand-orange text-white hover:bg-brand-orange-dark focus-visible:ring-brand-orange/40`}
        >
          Canjear premio
        </button>
      ) : (
        <button
          onClick={() => hacer("stamp")}
          disabled={ocupado}
          className={`${base} w-full bg-brand-forest text-brand-cream hover:bg-brand-forest-dark focus-visible:ring-brand-green/40`}
        >
          Sumar sello
        </button>
      )}
      <button
        onClick={() => hacer("unstamp")}
        disabled={ocupado || tarjeta.stamps === 0}
        className="w-full py-2 text-sm font-semibold text-gray-600 underline-offset-4 hover:underline disabled:no-underline disabled:opacity-40"
      >
        Me equivoqué, quitar un sello
      </button>
      {aviso && (
        <p
          role="status"
          className={`rounded-xl px-4 py-3 text-center text-sm font-semibold ${aviso.ok ? "bg-brand-green-light text-brand-green-dark" : "bg-red-50 text-red-700"}`}
        >
          {aviso.texto}
        </p>
      )}
    </div>
  );
}
