"use client";

import { useEffect, useRef, useState } from "react";
import type { TarjetaPublica } from "@/lib/fidelidad/publica";
import BotonesSello from "../BotonesSello";
import { borrarPin, buscarTarjeta, guardarPin, useEnNavegador, usePinGuardado } from "../accionesCliente";

type Escaner = { stop: () => Promise<void>; clear: () => void };

export default function PanelLocal() {
  const pin = usePinGuardado();
  const listo = useEnNavegador();
  const [tarjeta, setTarjeta] = useState<TarjetaPublica | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [escaneando, setEscaneando] = useState(false);
  const escaner = useRef<Escaner | null>(null);

  useEffect(() => () => void escaner.current?.stop().catch(() => {}), []);

  function salir() {
    borrarPin();
    setTarjeta(null);
  }

  async function buscar(q: string) {
    setError("");
    try {
      setTarjeta(await buscarTarjeta(q, pin));
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) return salir();
      setTarjeta(null);
      setError(err.message);
    }
  }

  async function abrirCamara() {
    setError("");
    setTarjeta(null);
    setEscaneando(true);
    const { Html5Qrcode } = await import("html5-qrcode");
    const lector = new Html5Qrcode("lector-qr");
    escaner.current = lector;
    try {
      await lector.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (texto) => {
          await lector.stop().catch(() => {});
          setEscaneando(false);
          buscar(texto);
        },
        () => {}
      );
    } catch {
      setEscaneando(false);
      setError("No pudimos abrir la cámara. Revisá el permiso del navegador.");
    }
  }

  async function cerrarCamara() {
    await escaner.current?.stop().catch(() => {});
    setEscaneando(false);
  }

  if (!listo) return null;

  if (!pin) {
    return (
      <form
        className="mt-10 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const valor = String(new FormData(e.currentTarget).get("pin") ?? "");
          const r = await fetch("/api/fidelidad/admin/buscar/?q=ping", { headers: { "x-admin-pin": valor } });
          if (r.status === 401) return setError("PIN incorrecto.");
          guardarPin(valor);
          setError("");
        }}
      >
        <h1 className="font-display text-2xl font-bold text-brand-forest-dark">Panel de sellos</h1>
        <p className="text-gray-700">Entrá con el PIN del local. Este celular queda habilitado para sellar.</p>
        <input
          name="pin"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-lg outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30"
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button className="h-12 w-full rounded-full bg-brand-forest font-display text-lg font-bold text-brand-cream">
          Entrar
        </button>
      </form>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-brand-forest-dark">Panel de sellos</h1>
        <button onClick={salir} className="text-sm font-semibold text-gray-500 hover:text-gray-800">
          Salir
        </button>
      </div>

      <div id="lector-qr" className={`mt-5 overflow-hidden rounded-3xl bg-black ${escaneando ? "" : "hidden"}`} />
      {escaneando ? (
        <button onClick={cerrarCamara} className="mt-3 w-full py-2 text-sm font-semibold text-gray-600">
          Cerrar cámara
        </button>
      ) : (
        <button
          onClick={abrirCamara}
          className="mt-5 h-16 w-full rounded-2xl bg-brand-forest font-display text-xl font-bold text-brand-cream hover:bg-brand-forest-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-green/40"
        >
          Escanear tarjeta
        </button>
      )}

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (busqueda.trim()) buscar(busqueda);
        }}
      >
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Celular o código ATR-…"
          aria-label="Buscar por celular o código"
          className="h-12 min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-4 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30"
        />
        <button className="h-12 rounded-xl bg-white px-4 font-semibold text-brand-forest-dark ring-1 ring-black/10">
          Buscar
        </button>
      </form>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {tarjeta && (
        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
          <p className="font-display text-xl font-bold text-gray-900">{tarjeta.name}</p>
          <p className="text-sm text-gray-600">
            {tarjeta.phone}, {tarjeta.code}
          </p>
          <img
            src={`/api/wallet/strip/${tarjeta.meta}/${tarjeta.stamps}/`}
            alt={`${tarjeta.stamps} de ${tarjeta.meta} sellos`}
            className="my-4 w-full rounded-xl"
          />
          <p className="mb-4 text-center font-semibold text-brand-forest-dark">{tarjeta.estado}</p>
          <BotonesSello tarjeta={tarjeta} pin={pin} onCambio={setTarjeta} onPinInvalido={salir} />
        </section>
      )}
    </div>
  );
}
