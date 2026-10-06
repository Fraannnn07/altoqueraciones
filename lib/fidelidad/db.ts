import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

export type Tarjeta = {
  id: string;
  code: string;
  name: string;
  phone: string;
  stamps: number;
  rewards_redeemed: number;
  apple_auth_token: string;
  /** Hash scrypt del código con el que el cliente entra a /fidelidad/ (lo genera el admin). */
  access_code_hash: string | null;
  login_failures: number;
  login_blocked_until: string | null;
  created_at: string;
  updated_at: string;
};

export type Evento = { id: number; kind: Accion; stamps_after: number; created_at: string };

export type Accion = "stamp" | "unstamp" | "redeem";

let cliente: SupabaseClient | null = null;

/** Cliente con service_role: solo del lado del servidor. */
export function db(): SupabaseClient {
  if (!cliente) {
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    cliente = createClient(url, key, { auth: { persistSession: false } });
  }
  return cliente;
}

/** Deja solo dígitos y pasa +598 9xxxxxxx a 09xxxxxxx. */
export function normalizarTelefono(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("598")) d = d.slice(3);
  if (d.length === 8 && d.startsWith("9")) d = "0" + d;
  return d.length >= 8 && d.length <= 9 ? d : null;
}

export const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I/L

function nuevoCodigo(): string {
  let s = "";
  for (const b of randomBytes(6)) s += ALFABETO[b % ALFABETO.length];
  return `ATR-${s}`;
}

export const esUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export async function tarjetaPorId(id: string): Promise<Tarjeta | null> {
  if (!esUuid(id)) return null;
  const { data } = await db().from("loyalty_cards").select("*").eq("id", id).maybeSingle();
  return (data as Tarjeta) ?? null;
}

export async function tarjetaPorCodigo(code: string): Promise<Tarjeta | null> {
  const { data } = await db().from("loyalty_cards").select("*").eq("code", code.trim().toUpperCase()).maybeSingle();
  return (data as Tarjeta) ?? null;
}

export async function tarjetaPorTelefono(phone: string): Promise<Tarjeta | null> {
  const { data } = await db().from("loyalty_cards").select("*").eq("phone", phone).maybeSingle();
  return (data as Tarjeta) ?? null;
}

/**
 * Crea la tarjeta con su código de acceso. Si ese celular ya tiene una, la devuelve sin tocarla
 * (nueva = false) y el código queda como estaba.
 */
export async function crearTarjeta(
  name: string,
  phone: string,
  accessCodeHash: string
): Promise<{ tarjeta: Tarjeta; nueva: boolean }> {
  const existente = await tarjetaPorTelefono(phone);
  if (existente) return { tarjeta: existente, nueva: false };

  for (let intento = 0; intento < 5; intento++) {
    const { data, error } = await db()
      .from("loyalty_cards")
      .insert({
        name,
        phone,
        code: nuevoCodigo(),
        apple_auth_token: randomBytes(24).toString("hex"),
        access_code_hash: accessCodeHash,
      })
      .select("*")
      .single();
    if (!error) return { tarjeta: data as Tarjeta, nueva: true };
    if (error.code !== "23505") throw error; // 23505 = valor duplicado
    const otra = await tarjetaPorTelefono(phone); // la creó otro request recién
    if (otra) return { tarjeta: otra, nueva: false };
  }
  throw new Error("No se pudo generar un código único");
}

/** Últimas tarjetas movidas, o las que coinciden con nombre, celular o código. */
export async function listarTarjetas(q: string, limite = 100): Promise<Tarjeta[]> {
  let consulta = db().from("loyalty_cards").select("*").order("updated_at", { ascending: false }).limit(limite);

  // Sin comas, paréntesis ni comodines: rompen la sintaxis del filtro "or" de PostgREST.
  const texto = q.replace(/[^\p{L}\p{N} -]/gu, " ").replace(/\s+/g, " ").trim();
  if (texto) {
    let digitos = q.replace(/\D/g, "");
    if (digitos.startsWith("598")) digitos = digitos.slice(3);
    const filtros = [`name.ilike.%${texto}%`, `code.ilike.%${texto.replace(/\s/g, "")}%`];
    if (digitos.length >= 3) filtros.push(`phone.like.%${digitos}%`);
    consulta = consulta.or(filtros.join(","));
  }

  const { data, error } = await consulta;
  if (error) throw error;
  return (data ?? []) as Tarjeta[];
}

export async function eventosDeTarjeta(id: string, limite = 30): Promise<Evento[]> {
  const { data } = await db()
    .from("loyalty_events")
    .select("id, kind, stamps_after, created_at")
    .eq("card_id", id)
    .order("created_at", { ascending: false })
    .limit(limite);
  return (data ?? []) as Evento[];
}

/** Cambia nombre y celular. Devuelve "duplicado" si el celular ya es de otra tarjeta. */
export async function actualizarDatos(id: string, name: string, phone: string): Promise<"ok" | "duplicado"> {
  const { error } = await db()
    .from("loyalty_cards")
    .update({ name, phone, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error?.code === "23505") return "duplicado";
  if (error) throw error;
  return "ok";
}

/** Guarda un código de acceso nuevo y desbloquea la tarjeta. Las sesiones abiertas del cliente se cierran. */
export async function guardarCodigoAcceso(id: string, accessCodeHash: string): Promise<void> {
  const { error } = await db()
    .from("loyalty_cards")
    .update({ access_code_hash: accessCodeHash, login_failures: 0, login_blocked_until: null })
    .eq("id", id);
  if (error) throw error;
}

export async function borrarTarjeta(id: string): Promise<void> {
  const { error } = await db().from("loyalty_cards").delete().eq("id", id);
  if (error) throw error;
}

/** Suma / resta un sello o canjea el premio, atómico en la base. */
export async function aplicarAccion(id: string, accion: Accion, meta: number): Promise<Tarjeta | null> {
  const { data, error } = await db().rpc("loyalty_apply", { p_card: id, p_kind: accion, p_goal: meta });
  if (error) throw error;
  const fila = (Array.isArray(data) ? data[0] : data) as Tarjeta | null;
  return fila?.id ? fila : null;
}
