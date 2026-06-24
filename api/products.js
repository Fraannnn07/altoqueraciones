// GET /api/products  → lista pública de productos activos.
import { supabase } from './_lib/db.js';
import { sendJson } from './_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Método no permitido' });
  }

  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, category, badge, tier, price, image_url')
    .eq('active', true)
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[products] Error Supabase:', error);
    return sendJson(res, 500, { error: 'No se pudieron cargar los productos.' });
  }

  // Cache liviano en el CDN de Vercel: 60s, revalidando en background.
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  return sendJson(res, 200, { products: data || [] });
}
