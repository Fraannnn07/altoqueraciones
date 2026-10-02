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
  created_at: string;
  updated_at: string;
};

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

const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I/L

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

/** Crea la tarjeta, o devuelve la existente si ese celular ya tiene una. */
export async function crearTarjeta(name: string, phone: string): Promise<Tarjeta> {
  const existente = await tarjetaPorTelefono(phone);
  if (existente) return existente;

  for (let intento = 0; intento < 5; intento++) {
    const { data, error } = await db()
      .from("loyalty_cards")
      .insert({ name, phone, code: nuevoCodigo(), apple_auth_token: randomBytes(24).toString("hex") })
      .select("*")
      .single();
    if (!error) return data as Tarjeta;
    if (error.code !== "23505") throw error; // 23505 = valor duplicado
    const otra = await tarjetaPorTelefono(phone); // la creó otro request recién
    if (otra) return otra;
  }
  throw new Error("No se pudo generar un código único");
}

/** Suma / resta un sello o canjea el premio, atómico en la base. */
export async function aplicarAccion(id: string, accion: Accion, meta: number): Promise<Tarjeta | null> {
  const { data, error } = await db().rpc("loyalty_apply", { p_card: id, p_kind: accion, p_goal: meta });
  if (error) throw error;
  const fila = (Array.isArray(data) ? data[0] : data) as Tarjeta | null;
  return fila?.id ? fila : null;
}
