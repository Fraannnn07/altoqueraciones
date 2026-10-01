// Helpers del panel (corren en el navegador del local).
import { useSyncExternalStore } from "react";
import type { TarjetaPublica } from "@/lib/fidelidad/publica";

export const PIN_KEY = "atr_fidelidad_pin";
const EVENTO_PIN = "atr-fidelidad-pin";
export type Accion = "stamp" | "unstamp" | "redeem";

export function pinGuardado(): string {
  try {
    return localStorage.getItem(PIN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function guardarPin(pin: string) {
  try {
    localStorage.setItem(PIN_KEY, pin);
  } catch {}
  window.dispatchEvent(new Event(EVENTO_PIN));
}

export function borrarPin() {
  try {
    localStorage.removeItem(PIN_KEY);
  } catch {}
  window.dispatchEvent(new Event(EVENTO_PIN));
}

function suscribirPin(avisar: () => void) {
  window.addEventListener("storage", avisar);
  window.addEventListener(EVENTO_PIN, avisar);
  return () => {
    window.removeEventListener("storage", avisar);
    window.removeEventListener(EVENTO_PIN, avisar);
  };
}

/** PIN guardado en este celular. En el servidor (y al hidratar) es "". */
export function usePinGuardado(): string {
  return useSyncExternalStore(suscribirPin, pinGuardado, () => "");
}

const sinSuscripcion = () => () => {};

/** false en el servidor y al hidratar; true una vez en el navegador (para no mostrar el login un instante). */
export function useEnNavegador(): boolean {
  return useSyncExternalStore(sinSuscripcion, () => true, () => false);
}

async function llamar(url: string, pin: string, init?: RequestInit): Promise<TarjetaPublica> {
  const r = await fetch(url, { ...init, headers: { "content-type": "application/json", "x-admin-pin": pin } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error ?? "Error inesperado"), { status: r.status });
  return j as TarjetaPublica;
}

export const buscarTarjeta = (q: string, pin: string) =>
  llamar(`/api/fidelidad/admin/buscar/?q=${encodeURIComponent(q)}`, pin);

export const aplicar = (id: string, accion: Accion, pin: string) =>
  llamar("/api/fidelidad/admin/accion/", pin, { method: "POST", body: JSON.stringify({ id, accion }) });

export const MENSAJES: Record<Accion, (t: TarjetaPublica) => string> = {
  stamp: (t) => `Sello sumado: ${t.stamps}/${t.meta}`,
  unstamp: (t) => `Sello quitado: ${t.stamps}/${t.meta}`,
  redeem: () => "Premio canjeado. La tarjeta arranca de nuevo.",
};
