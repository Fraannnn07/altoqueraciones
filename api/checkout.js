// POST /api/checkout
// Body: { items: [{ productId, qty }], customer: { name, phone, address, notes } }
// Recalcula precios desde la DB (nunca confía en el cliente), crea el pedido en estado
// 'pending', genera la preferencia de MercadoPago y devuelve el init_point para redirigir.
import { supabase } from './_lib/db.js';
import { sendJson, readJson } from './_lib/http.js';
import { MercadoPagoConfig, Preference } from 'mercadopago';

function baseUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['host'];
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Método no permitido' });
  }

  const body = await readJson(req);
  const rawItems = Array.isArray(body.items) ? body.items : [];
  const customer = body.customer || {};

  if (!rawItems.length) {
    return sendJson(res, 400, { error: 'El carrito está vacío.' });
  }
  if (!customer.name || !customer.phone) {
    return sendJson(res, 400, { error: 'Faltan datos de contacto (nombre y teléfono).' });
  }

  // Normalizar cantidades por producto.
  const qtyById = new Map();
  for (const it of rawItems) {
    const id = Number(it.productId);
    const qty = Math.max(1, Math.min(99, parseInt(it.qty, 10) || 0));
    if (!id || !qty) continue;
    qtyById.set(id, (qtyById.get(id) || 0) + qty);
  }
  if (!qtyById.size) {
    return sendJson(res, 400, { error: 'Carrito inválido.' });
  }

  // Traer productos reales (activos) desde la DB para fijar precios.
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, name, description, price, active')
    .in('id', [...qtyById.keys()])
    .eq('active', true);

  if (prodErr) {
    console.error('[checkout] Error trayendo productos:', prodErr);
    return sendJson(res, 500, { error: 'Error procesando el carrito.' });
  }
  if (!products || !products.length) {
    return sendJson(res, 400, { error: 'Los productos del carrito ya no están disponibles.' });
  }

  // Armar líneas con precio snapshot y total del servidor.
  let total = 0;
  const orderItems = [];
  const mpItems = [];
  for (const p of products) {
    const qty = qtyById.get(p.id);
    if (!qty) continue;
    total += p.price * qty;
    orderItems.push({
      product_id: p.id,
      product_name: p.description ? `${p.name} (${p.description})` : p.name,
      unit_price: p.price,
      quantity: qty,
    });
    mpItems.push({
      id: String(p.id),
      title: p.name.slice(0, 250),
      description: (p.description || '').slice(0, 250),
      quantity: qty,
      unit_price: p.price,
      currency_id: 'UYU',
    });
  }

  if (!orderItems.length) {
    return sendJson(res, 400, { error: 'No quedaron productos válidos en el carrito.' });
  }

  // 1) Crear el pedido (pending).
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      customer_name: String(customer.name).slice(0, 200),
      customer_phone: String(customer.phone).slice(0, 50),
      customer_address: String(customer.address || '').slice(0, 500),
      notes: String(customer.notes || '').slice(0, 1000),
      total,
      status: 'pending',
    })
    .select()
    .single();

  if (orderErr || !order) {
    console.error('[checkout] Error creando orden:', orderErr);
    return sendJson(res, 500, { error: 'No se pudo crear el pedido.' });
  }

  // 2) Insertar los items del pedido.
  const { error: itemsErr } = await supabase
    .from('order_items')
    .insert(orderItems.map((oi) => ({ ...oi, order_id: order.id })));

  if (itemsErr) {
    console.error('[checkout] Error insertando items:', itemsErr);
    return sendJson(res, 500, { error: 'No se pudo guardar el detalle del pedido.' });
  }

  // 3) Crear preferencia de MercadoPago.
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return sendJson(res, 500, { error: 'MercadoPago no está configurado (falta MP_ACCESS_TOKEN).' });
  }

  const site = baseUrl(req);
  try {
    const client = new MercadoPagoConfig({ accessToken: token });
    const pref = await new Preference(client).create({
      body: {
        items: mpItems,
        external_reference: String(order.id),
        notification_url: `${site}/api/mp-webhook`,
        back_urls: {
          success: `${site}/gracias.html?status=approved&order=${order.id}`,
          pending: `${site}/gracias.html?status=pending&order=${order.id}`,
          failure: `${site}/gracias.html?status=failure&order=${order.id}`,
        },
        auto_return: 'approved',
        statement_descriptor: 'ALTOQUERACIONES',
        metadata: { order_id: order.id },
      },
    });

    await supabase
      .from('orders')
      .update({ mp_preference_id: String(pref.id || '') })
      .eq('id', order.id);

    return sendJson(res, 200, {
      orderId: order.id,
      init_point: pref.init_point || pref.sandbox_init_point,
    });
  } catch (err) {
    console.error('[checkout] Error MercadoPago:', err);
    // Dejamos la orden en pending; el dueño la verá en el admin.
    return sendJson(res, 502, { error: 'No se pudo iniciar el pago con MercadoPago.' });
  }
}
