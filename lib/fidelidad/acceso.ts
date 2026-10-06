import "server-only";
import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { ALFABETO, db, tarjetaPorId, tarjetaPorTelefono, type Tarjeta } from "./db";

// Login del cliente: entra a /fidelidad/ con su celular y el código de acceso que le genera el admin.
// El código se guarda solo como hash. La sesión es una cookie firmada que incluye el hash del código,
// así que generar un código nuevo cierra las sesiones abiertas de esa tarjeta.

const scryptAsync = promisify(scrypt) as (clave: string, sal: Buffer, largo: number) => Promise<Buffer>;

export const COOKIE_CLIENTE = "atr_tarjeta";
export const SESION_CLIENTE_SEGUNDOS = 60 * 60 * 24 * 180;
export const LARGO_CODIGO = 6;
const MAX_FALLOS = 8;
const BLOQUEO_MINUTOS = 15;
const ERROR_DATOS = "El celular o el código no coinciden. Si no tenés el código, pedínoslo por WhatsApp.";

/** Código de acceso de 6 caracteres, sin 0/O/1/I/L para que no se confundan al escribirlo. */
export function nuevoCodigoAcceso(): string {
  let s = "";
  for (const b of randomBytes(LARGO_CODIGO)) s += ALFABETO[b % ALFABETO.length];
  return s;
}

/** "k7m 2qp" → "K7M2QP". */
export function normalizarCodigo(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function hashCodigo(codigo: string): Promise<string> {
  const sal = randomBytes(16);
  const hash = await scryptAsync(normalizarCodigo(codigo), sal, 32);
  return `scrypt$${sal.toString("base64url")}$${hash.toString("base64url")}`;
}

async function codigoValido(codigo: string, guardado: string): Promise<boolean> {
  const [alg, sal, hash] = guardado.split("$");
  if (alg !== "scrypt" || !sal || !hash) return false;
  const esperado = Buffer.from(hash, "base64url");
  if (esperado.length !== 32) return false;
  const calculado = await scryptAsync(normalizarCodigo(codigo), Buffer.from(sal, "base64url"), 32);
  return timingSafeEqual(calculado, esperado);
}

/** Hasta cuándo está bloqueado el ingreso por intentos fallidos, o null si no lo está. */
export function bloqueadaHasta(t: Tarjeta): Date | null {
  const hasta = t.login_blocked_until ? new Date(t.login_blocked_until) : null;
  return hasta && hasta.getTime() > Date.now() ? hasta : null;
}

/** Verifica celular + código. Después de varios intentos fallidos bloquea la tarjeta un rato. */
export async function verificarIngreso(
  phone: string,
  codigo: string
): Promise<{ ok: true; tarjeta: Tarjeta } | { ok: false; error: string }> {
  const t = await tarjetaPorTelefono(phone);
  if (!t?.access_code_hash) return { ok: false, error: ERROR_DATOS };

  if (bloqueadaHasta(t)) {
    return { ok: false, error: `Hubo demasiados intentos. Probá de nuevo en ${BLOQUEO_MINUTOS} minutos.` };
  }

  if (await codigoValido(codigo, t.access_code_hash)) {
    if (t.login_failures > 0 || t.login_blocked_until) {
      await db().from("loyalty_cards").update({ login_failures: 0, login_blocked_until: null }).eq("id", t.id);
    }
    return { ok: true, tarjeta: t };
  }

  const fallos = t.login_failures + 1;
  await db()
    .from("loyalty_cards")
    .update(
      fallos >= MAX_FALLOS
        ? { login_failures: 0, login_blocked_until: new Date(Date.now() + BLOQUEO_MINUTOS * 60_000).toISOString() }
        : { login_failures: fallos }
    )
    .eq("id", t.id);
  return { ok: false, error: ERROR_DATOS };
}

// Clave propia derivada de la service role key (ya está en Vercel y solo en el servidor), como la del admin.
function claveFirma(): Buffer | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createHash("sha256").update(`atr-fidelidad-cliente:${serviceKey}`).digest();
}

function firmar(id: string, vence: string, accessCodeHash: string, clave: Buffer): string {
  return createHmac("sha256", clave).update(`${id}.${vence}.${accessCodeHash}`).digest("base64url");
}

export function tokenSesion(t: Tarjeta): string | null {
  const clave = claveFirma();
  if (!clave || !t.access_code_hash) return null;
  const vence = String(Math.floor(Date.now() / 1000) + SESION_CLIENTE_SEGUNDOS);
  return `${t.id}.${vence}.${firmar(t.id, vence, t.access_code_hash, clave)}`;
}

/** Tarjeta del cliente con sesión abierta en este navegador, o null. */
export async function tarjetaDeSesion(): Promise<Tarjeta | null> {
  const token = (await cookies()).get(COOKIE_CLIENTE)?.value;
  if (!token) return null;
  const [id, vence, firma] = token.split(".");
  if (!id || !vence || !firma || !(Number(vence) > Date.now() / 1000)) return null;
  const clave = claveFirma();
  if (!clave) return null;

  const t = await tarjetaPorId(id);
  if (!t?.access_code_hash) return null;
  const dada = Buffer.from(firma);
  const esperada = Buffer.from(firmar(id, vence, t.access_code_hash, clave));
  return dada.length === esperada.length && timingSafeEqual(dada, esperada) ? t : null;
}
