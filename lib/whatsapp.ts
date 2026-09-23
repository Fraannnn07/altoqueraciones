import 'server-only';

const DEFAULT_OWNER_WHATSAPP = '59898623158';

/** Link wa.me con mensaje precargado para consultar por un producto. Se calcula en el servidor. */
export function buildProductWhatsAppUrl(product: { name: string; presentation?: string | null }): string {
  const number = process.env.OWNER_WHATSAPP || DEFAULT_OWNER_WHATSAPP;
  const label = product.presentation ? `${product.name} ${product.presentation}` : product.name;
  const text = `Hola, quiero consultar por ${label}.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** Link wa.me genérico (sin producto), para el header/footer/contacto. */
export function buildGeneralWhatsAppUrl(message = 'Hola, quiero hacer una consulta.'): string {
  const number = process.env.OWNER_WHATSAPP || DEFAULT_OWNER_WHATSAPP;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
