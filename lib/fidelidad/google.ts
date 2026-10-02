import "server-only";
import { createSign } from "node:crypto";
import { COLORES, META_SELLOS, NEGOCIO, PREMIO, SITE_URL, WHATSAPP, estadoTexto, urlStrip, urlTarjeta } from "./config";
import type { Tarjeta } from "./db";

const API = "https://walletobjects.googleapis.com/walletobjects/v1";
const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID ?? "";
const CLASS_ID = `${ISSUER_ID}.altoqueraciones_sellos`;

type Cuenta = { client_email: string; private_key: string };
let cuenta: Cuenta | null = null;

export const googleConfigurado = () => Boolean(ISSUER_ID && process.env.GOOGLE_WALLET_SA_B64);

function sa(): Cuenta {
  if (!cuenta) cuenta = JSON.parse(Buffer.from(process.env.GOOGLE_WALLET_SA_B64 ?? "", "base64").toString("utf8"));
  return cuenta!;
}

const b64url = (v: string | Buffer) => Buffer.from(v).toString("base64url");

function firmarJwt(claims: Record<string, unknown>): string {
  const cuerpo = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify(claims))}`;
  const firma = createSign("RSA-SHA256").update(cuerpo).sign(sa().private_key);
  return `${cuerpo}.${b64url(firma)}`;
}

let token: { valor: string; vence: number } | null = null;

async function accessToken(): Promise<string> {
  if (token && token.vence > Date.now() + 60_000) return token.valor;
  const ahora = Math.floor(Date.now() / 1000);
  const assertion = firmarJwt({
    iss: sa().client_email,
    scope: "https://www.googleapis.com/auth/wallet_object.issuer",
    aud: "https://oauth2.googleapis.com/token",
    iat: ahora,
    exp: ahora + 3600,
  });
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!r.ok) throw new Error(`Google OAuth ${r.status}: ${await r.text()}`);
  const j = (await r.json()) as { access_token: string; expires_in: number };
  token = { valor: j.access_token, vence: Date.now() + j.expires_in * 1000 };
  return token.valor;
}

async function api(method: string, path: string, body?: unknown): Promise<Response> {
  return fetch(`${API}${path}`, {
    method,
    headers: { authorization: `Bearer ${await accessToken()}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const objectId = (t: Tarjeta) => `${ISSUER_ID}.${t.id}`;

function clase() {
  return {
    id: CLASS_ID,
    issuerName: NEGOCIO,
    programName: "Tarjeta de sellos",
    programLogo: {
      sourceUri: { uri: `${SITE_URL}/wallet/google-logo.png` },
      contentDescription: { defaultValue: { language: "es-UY", value: NEGOCIO } },
    },
    hexBackgroundColor: COLORES.forest,
    reviewStatus: "UNDER_REVIEW",
  };
}

/** Campos que cambian con cada sello. */
function camposVariables(t: Tarjeta) {
  const sellos = Math.min(t.stamps, META_SELLOS);
  return {
    loyaltyPoints: { label: "Sellos", balance: { string: `${sellos}/${META_SELLOS}` } },
    heroImage: {
      sourceUri: { uri: urlStrip(sellos) },
      contentDescription: { defaultValue: { language: "es-UY", value: `${sellos} de ${META_SELLOS} sellos` } },
    },
    textModulesData: [
      { id: "estado", header: "Tu tarjeta", body: estadoTexto(sellos) },
      { id: "premio", header: "Premio", body: `Con ${META_SELLOS} sellos: ${PREMIO}` },
    ],
  };
}

function objeto(t: Tarjeta) {
  return {
    id: objectId(t),
    classId: CLASS_ID,
    state: "ACTIVE",
    accountId: t.code,
    accountName: t.name,
    barcode: { type: "QR_CODE", value: urlTarjeta(t.id), alternateText: t.code },
    linksModuleData: {
      uris: [
        { id: "web", uri: SITE_URL, description: "Pedí en altoqueraciones.com" },
        ...(WHATSAPP ? [{ id: "wa", uri: `https://wa.me/${WHATSAPP}`, description: "Escribinos por WhatsApp" }] : []),
      ],
    },
    ...camposVariables(t),
  };
}

let claseLista = false;

async function asegurarClase() {
  if (claseLista) return;
  const r = await api("GET", `/loyaltyClass/${CLASS_ID}`);
  if (r.status === 404) {
    const c = await api("POST", "/loyaltyClass", clase());
    if (!c.ok && c.status !== 409) throw new Error(`Google clase ${c.status}: ${await c.text()}`);
  } else if (!r.ok) {
    throw new Error(`Google clase ${r.status}: ${await r.text()}`);
  }
  claseLista = true;
}

/** Crea/actualiza el objeto y devuelve el link "Agregar a Google Wallet". */
export async function linkGuardarGoogle(t: Tarjeta): Promise<string> {
  await asegurarClase();
  const r = await api("POST", "/loyaltyObject", objeto(t));
  if (r.status === 409) await actualizarGoogle(t);
  else if (!r.ok) throw new Error(`Google objeto ${r.status}: ${await r.text()}`);

  const jwt = firmarJwt({
    iss: sa().client_email,
    aud: "google",
    typ: "savetowallet",
    origins: [SITE_URL],
    payload: { loyaltyObjects: [{ id: objectId(t) }] },
  });
  return `https://pay.google.com/gp/v/save/${jwt}`;
}

/** Refleja el sello nuevo en el pase guardado. Google lo empuja solo al celular. */
export async function actualizarGoogle(t: Tarjeta): Promise<void> {
  if (!googleConfigurado()) return;
  const r = await api("PATCH", `/loyaltyObject/${objectId(t)}`, camposVariables(t));
  if (!r.ok && r.status !== 404) console.error("[google wallet]", r.status, await r.text());
}
