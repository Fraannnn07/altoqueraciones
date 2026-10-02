import "server-only";
import { timingSafeEqual } from "node:crypto";

/** Valida el PIN que manda el panel en el header x-admin-pin. */
export function pinValido(req: Request): boolean {
  const esperado = process.env.FIDELIDAD_ADMIN_PIN ?? "";
  const recibido = req.headers.get("x-admin-pin") ?? "";
  if (esperado.length < 6) return false; // sin PIN configurado no hay panel
  const a = Buffer.from(esperado);
  const b = Buffer.from(recibido);
  return a.length === b.length && timingSafeEqual(a, b);
}
