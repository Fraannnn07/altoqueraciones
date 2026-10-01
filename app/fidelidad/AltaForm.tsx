"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AltaForm() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    const datos = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/fidelidad/tarjetas/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: datos.get("name"), phone: datos.get("phone") }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "No pudimos crear la tarjeta.");
      router.push(`/fidelidad/${j.id}/`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear la tarjeta.");
      setEnviando(false);
    }
  }

  const campo =
    "mt-1 h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-base text-gray-900 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/30";

  return (
    <form onSubmit={enviar} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-semibold text-gray-800">Tu nombre</span>
        <input name="name" required minLength={2} maxLength={60} autoComplete="given-name" className={campo} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-gray-800">Celular</span>
        <input
          name="phone"
          required
          inputMode="tel"
          autoComplete="tel"
          placeholder="099 123 456"
          className={campo}
        />
      </label>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="h-12 w-full rounded-full bg-brand-orange font-display text-lg font-bold text-white transition hover:bg-brand-orange-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-orange/40 disabled:opacity-60"
      >
        {enviando ? "Creando tu tarjeta…" : "Crear mi tarjeta"}
      </button>
    </form>
  );
}
