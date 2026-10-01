import type { Tarjeta } from "./db";
import { META_SELLOS, estadoTexto } from "./config";

/** Lo que se puede mandar al navegador (sin el token de Apple). */
export function tarjetaPublica(t: Tarjeta) {
  return {
    id: t.id,
    code: t.code,
    name: t.name,
    phone: t.phone,
    stamps: Math.min(t.stamps, META_SELLOS),
    meta: META_SELLOS,
    estado: estadoTexto(t.stamps),
    premioListo: t.stamps >= META_SELLOS,
    rewardsRedeemed: t.rewards_redeemed,
  };
}
export type TarjetaPublica = ReturnType<typeof tarjetaPublica>;
