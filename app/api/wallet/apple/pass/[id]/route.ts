import { NextResponse } from "next/server";
import { appleConfigurado, generarPase } from "@/lib/fidelidad/apple";
import { tarjetaPorId } from "@/lib/fidelidad/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Descarga del .pkpass (botón "Agregar a Apple Wallet")
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!appleConfigurado()) return NextResponse.json({ error: "Apple Wallet todavía no está configurado." }, { status: 503 });
  const { id } = await params;
  const t = await tarjetaPorId(id);
  if (!t) return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 404 });

  const pase = await generarPase(t);
  return new Response(new Uint8Array(pase), {
    headers: {
      "content-type": "application/vnd.apple.pkpass",
      "content-disposition": `attachment; filename="altoqueraciones-${t.code}.pkpass"`,
      "cache-control": "no-store",
    },
  });
}
