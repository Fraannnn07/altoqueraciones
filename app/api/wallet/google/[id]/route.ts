import { NextResponse } from "next/server";
import { tarjetaPorId } from "@/lib/fidelidad/db";
import { googleConfigurado, linkGuardarGoogle } from "@/lib/fidelidad/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Botón "Agregar a Google Wallet": crea el pase y redirige a Google.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!googleConfigurado()) return NextResponse.json({ error: "Google Wallet todavía no está configurado." }, { status: 503 });
  const { id } = await params;
  const t = await tarjetaPorId(id);
  if (!t) return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 404 });

  try {
    return NextResponse.redirect(await linkGuardarGoogle(t), 302);
  } catch (e) {
    console.error("[google wallet]", e);
    return NextResponse.json({ error: "No pudimos generar el pase de Google. Probá de nuevo." }, { status: 502 });
  }
}
