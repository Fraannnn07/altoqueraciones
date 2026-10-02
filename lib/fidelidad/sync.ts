import "server-only";
import { notificarApple } from "./apple";
import type { Tarjeta } from "./db";
import { actualizarGoogle } from "./google";

/** Actualiza el pase en los dos wallets. Nunca tira error: un wallet caído no frena el sello. */
export async function sincronizarWallets(t: Tarjeta): Promise<void> {
  const r = await Promise.allSettled([notificarApple(t), actualizarGoogle(t)]);
  for (const x of r) if (x.status === "rejected") console.error("[wallet sync]", x.reason);
}
