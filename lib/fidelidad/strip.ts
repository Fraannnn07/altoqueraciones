import "server-only";
import sharp from "sharp";
import { COLORES } from "./config";

// Huella en coordenadas unitarias (círculo de radio 1)
function huella(cx: number, cy: number, r: number, color: string, opacidad = 1): string {
  const s = r * 0.62;
  const e = (x: number, y: number, rx: number, ry: number, rot = 0) =>
    `<ellipse cx="${cx + x * s}" cy="${cy + y * s}" rx="${rx * s}" ry="${ry * s}" transform="rotate(${rot} ${cx + x * s} ${cy + y * s})"/>`;
  return `<g fill="${color}" opacity="${opacidad}">
    ${e(0, 0.3, 0.46, 0.36)}
    ${e(-0.62, -0.2, 0.17, 0.23, -28)}
    ${e(-0.24, -0.62, 0.18, 0.24, -8)}
    ${e(0.24, -0.62, 0.18, 0.24, 8)}
    ${e(0.62, -0.2, 0.17, 0.23, 28)}
  </g>`;
}

export function stripSvg(sellos: number, meta: number, w: number, h: number): string {
  const filas = meta <= 6 ? 1 : 2;
  const porFila = Math.ceil(meta / filas);
  const padX = w * 0.05;
  const padY = h * 0.1;
  const celdaW = (w - padX * 2) / porFila;
  const celdaH = (h - padY * 2) / filas;
  const radio = Math.min(celdaW * 0.4, celdaH * 0.42);
  const trazo = Math.max(2, radio * 0.07);

  let slots = "";
  for (let i = 0; i < meta; i++) {
    const fila = Math.floor(i / porFila);
    const col = i % porFila;
    const enFila = fila === filas - 1 ? meta - porFila * (filas - 1) : porFila;
    const offset = ((porFila - enFila) * celdaW) / 2; // centra la última fila si queda corta
    const cx = padX + offset + celdaW * col + celdaW / 2;
    const cy = padY + celdaH * fila + celdaH / 2;
    const esPremio = i === meta - 1;
    const color = esPremio ? COLORES.naranja : COLORES.forest;

    if (i < sellos) {
      slots += `<circle cx="${cx}" cy="${cy}" r="${radio}" fill="${color}"/>${huella(cx, cy, radio, COLORES.crema)}`;
    } else {
      slots += `<circle cx="${cx}" cy="${cy}" r="${radio - trazo / 2}" fill="none" stroke="${color}" stroke-width="${trazo}" stroke-dasharray="${trazo * 2.2} ${trazo * 1.6}" opacity="${esPremio ? 0.9 : 0.45}"/>${huella(cx, cy, radio, color, esPremio ? 0.35 : 0.14)}`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="100%" height="100%" fill="${COLORES.crema}"/>${slots}</svg>`;
}

const cache = new Map<string, Buffer>();

export async function stripPng(sellos: number, meta: number, w: number, h: number): Promise<Buffer> {
  const s = Math.max(0, Math.min(sellos, meta));
  const key = `${s}/${meta}/${w}x${h}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const png = await sharp(Buffer.from(stripSvg(s, meta, w, h))).png().toBuffer();
  cache.set(key, png);
  return png;
}
