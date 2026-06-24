// Admin CRUD de productos. Protegido por header 'x-admin-password' = ADMIN_PASSWORD.
//   GET    /api/admin/products            → lista TODOS (activos e inactivos)
//   POST   /api/admin/products            → crea producto
//   PATCH  /api/admin/products?id=123      → edita (precio, active=dar de baja, etc.)
//   DELETE /api/admin/products?id=123      → elimina definitivamente
import { supabase } from '../_lib/db.js';
import { sendJson, readJson, requireAdmin } from '../_lib/http.js';

const CATEGORIES = ['perros_adultos', 'cachorros', 'gatos', 'accesorios', 'vet'];
const TIERS = ['premium', 'standard', 'economico'];

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  const id = req.query && req.query.id ? Number(req.query.id) : null;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true });
    if (error) return sendJson(res, 500, { error: 'Error cargando productos.' });
    return sendJson(res, 200, { products: data || [] });
  }

  if (req.method === 'POST') {
    const b = await readJson(req);
    if (!b.name || !CATEGORIES.includes(b.category)) {
      return sendJson(res, 400, { error: 'Nombre y categoría válida son obligatorios.' });
    }
    const row = {
      name: String(b.name).slice(0, 200),
      description: String(b.description || '').slice(0, 500),
      category: b.category,
      badge: String(b.badge || '').slice(0, 50),
      tier: TIERS.includes(b.tier) ? b.tier : 'standard',
      price: Math.max(0, parseInt(b.price, 10) || 0),
      image_url: String(b.image_url || '').slice(0, 1000),
      active: b.active !== false,
      sort_order: parseInt(b.sort_order, 10) || 0,
    };
    const { data, error } = await supabase.from('products').insert(row).select().single();
    if (error) return sendJson(res, 500, { error: 'No se pudo crear el producto.' });
    return sendJson(res, 201, { product: data });
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    if (!id) return sendJson(res, 400, { error: 'Falta id.' });
    const b = await readJson(req);
    const patch = {};
    if (b.name !== undefined) patch.name = String(b.name).slice(0, 200);
    if (b.description !== undefined) patch.description = String(b.description).slice(0, 500);
    if (b.category !== undefined && CATEGORIES.includes(b.category)) patch.category = b.category;
    if (b.badge !== undefined) patch.badge = String(b.badge).slice(0, 50);
    if (b.tier !== undefined && TIERS.includes(b.tier)) patch.tier = b.tier;
    if (b.price !== undefined) patch.price = Math.max(0, parseInt(b.price, 10) || 0);
    if (b.image_url !== undefined) patch.image_url = String(b.image_url).slice(0, 1000);
    if (b.active !== undefined) patch.active = !!b.active;
    if (b.sort_order !== undefined) patch.sort_order = parseInt(b.sort_order, 10) || 0;

    if (!Object.keys(patch).length) return sendJson(res, 400, { error: 'Nada para actualizar.' });

    const { data, error } = await supabase
      .from('products')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) return sendJson(res, 500, { error: 'No se pudo actualizar.' });
    return sendJson(res, 200, { product: data });
  }

  if (req.method === 'DELETE') {
    if (!id) return sendJson(res, 400, { error: 'Falta id.' });
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return sendJson(res, 500, { error: 'No se pudo eliminar.' });
    return sendJson(res, 200, { ok: true });
  }

  return sendJson(res, 405, { error: 'Método no permitido' });
}
