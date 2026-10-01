import { timingSafeEqual } from "node:crypto";
import { PASS_TYPE_ID, generarPase } from "@/lib/fidelidad/apple";
import { db, esUuid, tarjetaPorId, type Tarjeta } from "@/lib/fidelidad/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Web service de Apple Wallet. Apple llama a:
//   POST   /v1/devices/:device/registrations/:passType/:serial   (registrar iPhone)
//   GET    /v1/devices/:device/registrations/:passType           (¿qué pases cambiaron?)
//   DELETE /v1/devices/:device/registrations/:passType/:serial   (borró el pase)
//   GET    /v1/passes/:passType/:serial                          (bajar pase actualizado)
//   POST   /v1/log                                               (errores del lado de Apple)

type Ctx = { params: Promise<{ ruta: string[] }> };
const vacio = (status: number) => new Response(null, { status });

async function autorizada(req: Request, serial: string): Promise<Tarjeta | null> {
  if (!esUuid(serial)) return null;
  const t = await tarjetaPorId(serial);
  const h = req.headers.get("authorization") ?? "";
  if (!t || !h.startsWith("ApplePass ")) return null;
  const a = Buffer.from(h.slice(10));
  const b = Buffer.from(t.apple_auth_token);
  return a.length === b.length && timingSafeEqual(a, b) ? t : null;
}

export async function POST(req: Request, { params }: Ctx) {
  const ruta = (await params).ruta;

  if (ruta[0] === "log") {
    const body = await req.json().catch(() => ({}));
    console.warn("[apple wallet log]", JSON.stringify(body));
    return vacio(200);
  }

  const [devices, device, registrations, passType, serial] = ruta;
  if (devices !== "devices" || registrations !== "registrations" || passType !== PASS_TYPE_ID || !serial) return vacio(404);
  if (!(await autorizada(req, serial))) return vacio(401);

  const { pushToken } = (await req.json().catch(() => ({}))) as { pushToken?: string };
  if (!pushToken) return vacio(400);

  const { data: existe } = await db()
    .from("apple_wallet_registrations")
    .select("device_library_id")
    .eq("device_library_id", device)
    .eq("serial_number", serial)
    .maybeSingle();

  await db()
    .from("apple_wallet_registrations")
    .upsert({ device_library_id: device, serial_number: serial, push_token: pushToken });

  return vacio(existe ? 200 : 201);
}

export async function DELETE(req: Request, { params }: Ctx) {
  const [devices, device, registrations, passType, serial] = (await params).ruta;
  if (devices !== "devices" || registrations !== "registrations" || passType !== PASS_TYPE_ID || !serial) return vacio(404);
  if (!(await autorizada(req, serial))) return vacio(401);
  await db().from("apple_wallet_registrations").delete().eq("device_library_id", device).eq("serial_number", serial);
  return vacio(200);
}

export async function GET(req: Request, { params }: Ctx) {
  const ruta = (await params).ruta;

  // Bajar el pase actualizado
  if (ruta[0] === "passes") {
    const [, passType, serial] = ruta;
    if (passType !== PASS_TYPE_ID || !serial) return vacio(404);
    const t = await autorizada(req, serial);
    if (!t) return vacio(401);

    const modificado = new Date(t.updated_at);
    const desde = req.headers.get("if-modified-since");
    if (desde && Math.floor(modificado.getTime() / 1000) <= Math.floor(new Date(desde).getTime() / 1000)) {
      return vacio(304);
    }
    const pase = await generarPase(t);
    return new Response(new Uint8Array(pase), {
      headers: {
        "content-type": "application/vnd.apple.pkpass",
        "last-modified": modificado.toUTCString(),
        "cache-control": "no-store",
      },
    });
  }

  // Qué pases de este dispositivo cambiaron
  const [devices, device, registrations, passType] = ruta;
  if (devices !== "devices" || registrations !== "registrations" || passType !== PASS_TYPE_ID) return vacio(404);

  const { data: regs } = await db()
    .from("apple_wallet_registrations")
    .select("serial_number")
    .eq("device_library_id", device);
  if (!regs?.length) return vacio(204);

  const desde = new URL(req.url).searchParams.get("passesUpdatedSince");
  let q = db()
    .from("loyalty_cards")
    .select("id, updated_at")
    .in("id", regs.map((r) => r.serial_number));
  if (desde && /^\d+$/.test(desde)) q = q.gt("updated_at", new Date(Number(desde)).toISOString());

  const { data: cards } = await q;
  if (!cards?.length) return vacio(204);

  const ultimo = Math.max(...cards.map((c) => new Date(c.updated_at).getTime()));
  return Response.json({ serialNumbers: cards.map((c) => c.id), lastUpdated: String(ultimo) });
}
