// Configuración de la tarjeta de sellos. Todo sale de variables de entorno.
// Variable propia: la SITE_URL de la web es localhost en .env.local y no sirve para los pases.
export const SITE_URL = (process.env.FIDELIDAD_SITE_URL ?? "https://altoqueraciones.com").replace(/\/$/, "");

/** Sellos necesarios para el premio (1 a 10). */
export const META_SELLOS = Math.min(10, Math.max(1, Number(process.env.FIDELIDAD_SELLOS_META ?? 6)));

/** Lo que gana el cliente al completar la tarjeta. */
export const PREMIO = process.env.FIDELIDAD_PREMIO ?? "10% de descuento en tu próxima bolsa";

export const NEGOCIO = "Al Toque Raciones";
export const WHATSAPP = (process.env.WHATSAPP_NUMBER ?? process.env.OWNER_WHATSAPP ?? "").replace(/\D/g, ""); // ej: 59899123456

// Mismos colores que la web
export const COLORES = {
  forest: "#134b32",
  forestDark: "#0d3a26",
  verdeIcono: "#0E5C36",
  naranja: "#f5891f",
  crema: "#f9f6ee",
};

export function estadoTexto(sellos: number): string {
  if (sellos >= META_SELLOS) return "¡Premio listo para canjear!";
  const faltan = META_SELLOS - sellos;
  return faltan === 1 ? "Te falta 1 sello" : `Te faltan ${faltan} sellos`;
}

/** Lo que va dentro del QR del pase: la página de la tarjeta. */
export function urlTarjeta(id: string): string {
  return `${SITE_URL}/fidelidad/${id}/`;
}

/** Imagen de huellitas (cambia la URL con cada sello, así Google la refresca). */
export function urlStrip(sellos: number): string {
  return `${SITE_URL}/api/wallet/strip/${META_SELLOS}/${sellos}/`;
}
