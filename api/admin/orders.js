// GET /api/admin/orders  → histórico de pedidos con sus items. Protegido por ADMIN_PASSWORD.
// Query opcional: ?status=paid|pending|cancelled  y  ?limit=100
import { supabase } from '../_lib/db.js';
import { sendJson, requireAdmin } from '../_lib/http.js';

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Método no permitido' });

  const status = req.query && req.query.status;
  const limit = Math.min(500, parseInt((req.query && req.query.limit) || '100', 10) || 100);

  let query = supabase
    .from('orders')
    .select('*, order_items(product_name, unit_price, quantity)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    console.error('[admin/orders] Error:', error);
    return sendJson(res, 500, { error: 'Error cargando pedidos.' });
  }
  return sendJson(res, 200, { orders: data || [] });
}
