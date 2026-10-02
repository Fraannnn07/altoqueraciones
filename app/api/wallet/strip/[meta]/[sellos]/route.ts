import { stripPng } from "@/lib/fidelidad/strip";

export const runtime = "nodejs";

// Imagen de huellitas para Google Wallet y para la página de la tarjeta.
export async function GET(req: Request, { params }: { params: Promise<{ meta: string; sellos: string }> }) {
  const p = await params;
  const meta = Number(p.meta);
  const sellos = Number(p.sellos);
  if (!Number.isInteger(meta) || !Number.isInteger(sellos) || meta < 1 || meta > 10 || sellos < 0 || sellos > meta) {
    return new Response("Not found", { status: 404 });
  }
  const png = await stripPng(sellos, meta, 1032, 336);
  return new Response(new Uint8Array(png), {
    headers: { "content-type": "image/png", "cache-control": "public, max-age=31536000, immutable" },
  });
}
