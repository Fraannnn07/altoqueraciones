import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

// Path "/" (antes "/admin"): el link del QR de la tarjeta de sellos (/fidelidad/<id>/) también tiene que saber
// si quien lo abre es el admin. El nombre cambió junto con el path para que una cookie vieja con path /admin
// no siga viva después de "Salir" (dos cookies con el mismo nombre y distinto path no se pueden borrar juntas).
export const ADMIN_COOKIE = 'atr_admin_s';
export const ADMIN_SESSION_SECONDS = 60 * 60 * 24 * 7;

// Usuarios del admin: ADMIN_USERS = "franco:<sal>.<hash>,diego:<sal>.<hash>" (scrypt en base64url, se arma con
// `node scripts/admin-user.mjs usuario contraseña`). Las contraseñas no van en el código porque el repo es
// público. Sin ADMIN_USERS se entra como antes: usuario "admin" y la contraseña ADMIN_PASSWORD.
const LEGACY_USER = 'admin';
const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, length: number) => Promise<Buffer>;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** usuario → "sal.hash" guardado en ADMIN_USERS. */
function adminUsers(): Map<string, string> {
  const users = new Map<string, string>();
  for (const entry of (process.env.ADMIN_USERS ?? '').split(',')) {
    const [name, stored] = entry.trim().split(':');
    if (name && stored?.includes('.')) users.set(normalizeUsername(name), stored);
  }
  return users;
}

/**
 * Lo que entra en la firma de la sesión de cada usuario: su hash guardado. Cambiarle la contraseña cierra
 * sus sesiones abiertas; null = el usuario no existe (o se lo sacó de ADMIN_USERS).
 */
function userSecret(user: string): string | null {
  const users = adminUsers();
  if (users.size === 0) return user === LEGACY_USER ? '' : null;
  return users.get(user) ?? null;
}

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

export function createSessionToken(user: string): string | null {
  const key = signingKey();
  const secret = userSecret(user);
  if (!key || secret === null) return null;
  const expires = String(Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS);
  return `${user}.${expires}.${sign(`${user}.${expires}.${secret}`, key)}`;
}

/** Usuario de la sesión, o null si la cookie no es válida o venció. */
export function sessionUser(token: string | undefined): string | null {
  if (!token) return null;
  const key = signingKey();
  if (!key) return null;
  const [user, expires, signature] = token.split('.');
  if (!user || !expires || !signature) return null;
  const secret = userSecret(user);
  if (secret === null) return null;
  const given = Buffer.from(signature);
  const expected = Buffer.from(sign(`${user}.${expires}.${secret}`, key));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const expiresAt = Number(expires);
  return Number.isFinite(expiresAt) && expiresAt > Date.now() / 1000 ? user : null;
}

export function verifySessionToken(token: string | undefined): boolean {
  return sessionUser(token) !== null;
}

/** Comparación en tiempo constante (se comparan los hashes, así el largo no filtra información). */
function legacyPasswordValid(input: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const a = createHash('sha256').update(input).digest();
  const b = createHash('sha256').update(password).digest();
  return timingSafeEqual(a, b);
}

/** Usuario + contraseña → nombre de usuario si son correctos, o null. */
export async function verifyAdminLogin(username: string, password: string): Promise<string | null> {
  const user = normalizeUsername(username);
  const users = adminUsers();
  if (users.size === 0) return user === LEGACY_USER && legacyPasswordValid(password) ? user : null;

  const [salt, hash] = (users.get(user) ?? '').split('.');
  // Con un usuario que no existe se calcula igual, para que la demora no delate cuáles existen.
  const expected = hash ? Buffer.from(hash, 'base64url') : randomBytes(32);
  const computed = await scryptAsync(password, salt ? Buffer.from(salt, 'base64url') : randomBytes(16), 32);
  return hash && expected.length === computed.length && timingSafeEqual(computed, expected) ? user : null;
}
