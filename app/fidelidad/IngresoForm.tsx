"use client";

import { useActionState, useSyncExternalStore } from "react";
import { submitWithoutReset } from "@/components/admin/submit-without-reset";
import { ingresarAction, type EstadoIngreso } from "./actions";

// El link que mandamos por WhatsApp trae el celular y el código después del "#" (no llegan al servidor):
// /fidelidad/#tel=099123456&codigo=K7M2QP. Acá se leen para dejar el formulario completo.
function suscribirHash(avisar: () => void) {
  window.addEventListener("hashchange", avisar);
  return () => window.removeEventListener("hashchange", avisar);
}

export default function IngresoForm() {
  const [estado, enviar, enviando] = useActionState<EstadoIngreso, FormData>(ingresarAction, {});
  const hash = useSyncExternalStore(suscribirHash, () => window.location.hash, () => "");
  const datos = new URLSearchParams(hash.slice(1));

  const campo =
    "mt-1 h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-base text-gray-900 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/30";

  return (
    // La key vuelve a montar los campos cuando aparece el "#" (al hidratar), así toman los valores del link.
    <form key={hash} onSubmit={submitWithoutReset(enviar)} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-semibold text-gray-800">Celular</span>
        <input
          name="tel"
          required
          inputMode="tel"
          autoComplete="tel"
          placeholder="099 123 456"
          defaultValue={datos.get("tel") ?? ""}
          className={campo}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-gray-800">Código de acceso</span>
        <input
          name="codigo"
          required
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={12}
          placeholder="Ej.: K7M2QP"
          defaultValue={datos.get("codigo") ?? ""}
          className={`${campo} font-mono uppercase tracking-widest placeholder:font-sans placeholder:normal-case placeholder:tracking-normal`}
        />
      </label>
      {estado.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {estado.error}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="h-12 w-full rounded-full bg-brand-orange font-display text-lg font-bold text-white transition hover:bg-brand-orange-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-orange/40 disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Ver mi tarjeta"}
      </button>
    </form>
  );
}
