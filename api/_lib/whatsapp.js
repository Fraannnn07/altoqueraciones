// Envío del aviso de pedido al WhatsApp del dueño vía WhatsApp Cloud API (Meta).
// Requiere: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, OWNER_WHATSAPP (ej. 59898623158).
//
// IMPORTANTE sobre Cloud API: fuera de la "ventana" de 24hs de conversación, Meta solo
// permite enviar mensajes de PLANTILLA aprobada (no texto libre). Como este aviso lo inicia
// el sistema, lo normal es usar una plantilla. Por defecto mandamos texto libre (sirve en
// pruebas y si el dueño ya escribió al número), y si definís WHATSAPP_TEMPLATE_NAME usamos
// esa plantilla. Ver README para crear la plantilla.

const GRAPH = 'https://graph.facebook.com/v21.0';

function money(n) {
  return '$' + Number(n || 0).toLocaleString('es-UY');
}

export function buildOrderText(order, items) {
  const lines = (items || []).map(
    (it) => `• ${it.quantity}x ${it.product_name} — ${money(it.unit_price * it.quantity)}`
  );
  return [
    `🛒 *Nuevo pedido PAGADO #${order.id}*`,
    '',
    `👤 ${order.customer_name}`,
    `📞 ${order.customer_phone}`,
    order.customer_address ? `📍 ${order.customer_address}` : null,
    order.notes ? `📝 ${order.notes}` : null,
    '',
    ...lines,
    '',
    `*Total: ${money(order.total)}*`,
    `💳 Pago MercadoPago: ${order.mp_payment_id || 's/d'}`,
  ]
    .filter((l) => l !== null)
    .join('\n');
}

export async function sendOrderNotification(order, items) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = (process.env.OWNER_WHATSAPP || '59898623158').replace(/[^\d]/g, '');

  if (!token || !phoneId) {
    console.warn('[whatsapp] Faltan WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID. Aviso no enviado.');
    return { ok: false, skipped: true };
  }

  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  let payload;

  if (templateName) {
    // Plantilla con un parámetro de cuerpo: el resumen del pedido como texto.
    payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'es' },
        components: [
          { type: 'body', parameters: [{ type: 'text', text: buildOrderText(order, items) }] },
        ],
      },
    };
  } else {
    payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: buildOrderText(order, items) },
    };
  }

  try {
    const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('[whatsapp] Error de la API:', JSON.stringify(data));
      return { ok: false, error: data };
    }
    return { ok: true, data };
  } catch (err) {
    console.error('[whatsapp] Excepción al enviar:', err);
    return { ok: false, error: String(err) };
  }
}
