import { after, NextResponse } from "next/server";
import { pinValido } from "@/lib/fidelidad/admin";
import { META_SELLOS } from "@/lib/fidelidad/config";
import { aplicarAccion, esUuid, tarjetaPorId, type Accion } from "@/lib/fidelidad/db";
import { tarjetaPublica } from "@/lib/fidelidad/publica";
import { sincronizarWallets } from "@/lib/fidelidad/sync";

export const runtime = "nodejs";

const ACCIONES: Accion[] = ["stamp", "unstamp", "redeem"];

export async function POST(req: Request) {
  if (!pinValido(req)) return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { id?: string; accion?: Accion } | null;
  if (!body?.id || !esUuid(body.id) || !body.accion || !ACCIONES.includes(body.accion)) {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }

  const actual = await tarjetaPorId(body.id);
  if (!actual) return NextResponse.json({ error: "No encontramos esa tarjeta." }, { status: 404 });

  if (body.accion === "stamp" && actual.stamps >= META_SELLOS) {
    return NextResponse.json({ error: "La tarjeta está completa. Canjeá el premio primero." }, { status: 409 });
  }
  if (body.accion === "redeem" && actual.stamps < META_SELLOS) {
    return NextResponse.json({ error: "Todavía no llegó al premio." }, { status: 409 });
  }

  const t = await aplicarAccion(body.id, body.accion, META_SELLOS);
  if (!t) return NextResponse.json({ error: "No se pudo actualizar." }, { status: 409 });

  // Los wallets se actualizan después de responder, así el panel no espera.
  after(() => sincronizarWallets(t));
  return NextResponse.json(tarjetaPublica(t));
}
