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

/**
 * Link para que el cliente entre a su tarjeta con el celular y el código ya cargados. Van después del "#",
 * así no llegan al servidor ni quedan en los logs.
 */
export function urlIngreso(phone: string, codigo: string): string {
  return `${SITE_URL}/fidelidad/#tel=${phone}&codigo=${codigo}`;
}

/** wa.me al celular del cliente (099 123 456 → 59899123456) con el mensaje precargado. */
export function whatsappCliente(phone: string, texto: string): string {
  return `https://wa.me/598${phone.replace(/^0/, "")}?text=${encodeURIComponent(texto)}`;
}

/** Mensaje con el código de acceso: al crear la tarjeta (nueva) o al generar un código nuevo. */
export function mensajeCodigo(name: string, phone: string, codigo: string, nueva: boolean): string {
  const nombre = name.split(" ")[0];
  return [
    nueva
      ? `¡Hola ${nombre}! Ya tenés tu tarjeta de sellos de ${NEGOCIO}. Cada compra suma una huella y con ${META_SELLOS} te llevás ${PREMIO}.`
      : `¡Hola ${nombre}! Te mandamos un código nuevo para ver tu tarjeta de sellos de ${NEGOCIO}.`,
    `Entrá acá para verla: ${urlIngreso(phone, codigo)}`,
    `Tu código de acceso: ${codigo}`,
  ].join("\n\n");
}

/** 099123456 → "099 123 456" (los fijos de 8 dígitos quedan como están). */
export function telefonoLegible(phone: string): string {
  return phone.length === 9 ? `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}` : phone;
}
