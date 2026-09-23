import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_COOKIE = 'atr_admin';
export const ADMIN_SESSION_SECONDS = 60 * 60 * 24 * 7;

// La clave de firma se deriva de ADMIN_PASSWORD + SUPABASE_SERVICE_ROLE_KEY (ambas ya
// configuradas en Vercel y solo en el servidor): cambiar la contraseña invalida las
// sesiones abiertas y no hace falta una variable de entorno nueva.
function signingKey(): Buffer | null {
  const password = process.env.ADMIN_PASSWORD;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!password || !serviceKey) return null;
  return createHash('sha256').update(`atr-admin-session:${password}:${serviceKey}`).digest();
}

function sign(payload: string, key: Buffer): string {
  return createHmac('sha256', key).update(payload).digest('base64url');
}

export function createSessionToken(): string | null {
  const key = signingKey();
  if (!key) return null;
  const expires = String(Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS);
  return `${expires}.${sign(expires, key)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const key = signingKey();
  if (!key) return false;
  const [expires, signature] = token.split('.');
  if (!expires || !signature) return false;
  const given = Buffer.from(signature);
  const expected = Buffer.from(sign(expires, key));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;
  const expiresAt = Number(expires);
  return Number.isFinite(expiresAt) && expiresAt > Date.now() / 1000;
}

/** Comparación en tiempo constante (se comparan los hashes, así el largo no filtra información). */
export function isAdminPasswordValid(input: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const a = createHash('sha256').update(input).digest();
  const b = createHash('sha256').update(password).digest();
  return timingSafeEqual(a, b);
}
