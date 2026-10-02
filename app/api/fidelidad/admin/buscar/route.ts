import { NextResponse } from "next/server";
import { pinValido } from "@/lib/fidelidad/admin";
import { esUuid, normalizarTelefono, tarjetaPorCodigo, tarjetaPorId, tarjetaPorTelefono } from "@/lib/fidelidad/db";
import { tarjetaPublica } from "@/lib/fidelidad/publica";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Acepta: lo que lee el QR (URL de la tarjeta), el código ATR-XXXXXX o un celular.
export async function GET(req: Request) {
  if (!pinValido(req)) return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  const uuid = q.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];

  let t = null;
  if (uuid && esUuid(uuid)) t = await tarjetaPorId(uuid);
  else if (/^ATR-/i.test(q)) t = await tarjetaPorCodigo(q);
  else {
    const tel = normalizarTelefono(q);
    if (tel) t = await tarjetaPorTelefono(tel);
  }

  if (!t) return NextResponse.json({ error: "No encontramos esa tarjeta." }, { status: 404 });
  return NextResponse.json(tarjetaPublica(t));
}
