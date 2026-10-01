import { NextResponse } from "next/server";
import { crearTarjeta, normalizarTelefono } from "@/lib/fidelidad/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { name?: string; phone?: string } | null;
  const name = (body?.name ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
  const phone = normalizarTelefono(body?.phone ?? "");

  if (name.length < 2) return NextResponse.json({ error: "Escribí tu nombre." }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "Revisá el celular: tiene que ser tipo 099 123 456." }, { status: 400 });

  try {
    const t = await crearTarjeta(name, phone);
    return NextResponse.json({ id: t.id });
  } catch (e) {
    console.error("[fidelidad alta]", e);
    return NextResponse.json({ error: "No pudimos crear la tarjeta. Probá de nuevo en un minuto." }, { status: 500 });
  }
}
