// POST /api/mp-webhook  → notificaciones de MercadoPago.
// No confía en el payload: consulta el pago a la API de MP para confirmar el estado.
// Si está aprobado, marca el pedido como 'paid' (idempotente) y avisa por WhatsApp.
import { supabase } from './_lib/db.js';
import { readJson } from './_lib/http.js';
import { sendOrderNotification } from './_lib/whatsapp.js';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export default async function handler(req, res) {
  // Responder rápido siempre: MP reintenta si no recibe 200.
  try {
    const body = req.method === 'POST' ? await readJson(req) : {};
    const q = req.query || {};

    const type = q.type || q.topic || body.type || body.topic;
    const paymentId =
      q['data.id'] || (body.data && body.data.id) || q.id || body.id;

    // Solo nos interesan notificaciones de pago.
    if (type && String(type).indexOf('payment') === -1) {
      return res.status(200).send('ignored');
    }
    if (!paymentId) {
      return res.status(200).send('no-id');
    }

    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
      console.error('[webhook] Falta MP_ACCESS_TOKEN');
      return res.status(200).send('no-token');
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const payment = await new Payment(client).get({ id: String(paymentId) });

    const orderId = Number(payment.external_reference);
    if (!orderId) return res.status(200).send('no-ref');

    if (payment.status !== 'approved') {
      // Pago no aprobado (pending/rejected): no tocamos el pedido.
      return res.status(200).send('not-approved');
    }

    // Traer el pedido y evitar doble procesamiento.
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      console.error('[webhook] Pedido no encontrado:', orderId, orderErr);
      return res.status(200).send('order-not-found');
    }

    if (order.status === 'paid') {
      return res.status(200).send('already-paid'); // idempotencia
    }

    const { error: updErr } = await supabase
      .from('orders')
      .update({ status: 'paid', mp_payment_id: String(payment.id) })
      .eq('id', orderId)
      .eq('status', 'pending'); // condición de carrera: solo si seguía pending

    if (updErr) {
      console.error('[webhook] Error actualizando pedido:', updErr);
      return res.status(200).send('update-error');
    }

    // Traer items y avisar al dueño por WhatsApp.
    const { data: items } = await supabase
      .from('order_items')
      .select('product_name, unit_price, quantity')
      .eq('order_id', orderId);

    await sendOrderNotification(
      { ...order, status: 'paid', mp_payment_id: String(payment.id) },
      items || []
    );

    return res.status(200).send('ok');
  } catch (err) {
    console.error('[webhook] Excepción:', err);
    // 200 igual para que MP no reintente en loop por un error nuestro transitorio.
    return res.status(200).send('error');
  }
}
