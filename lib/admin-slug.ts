import 'server-only';
import { supabase } from '@/lib/supabase';

/** Devuelve un slug libre en la tabla: "lager", "lager-2", "lager-3"… */
export async function uniqueSlug(
  table: 'products' | 'brands',
  base: string,
  excludeId?: number,
): Promise<string> {
  const root = base || 'item';
  let candidate = root;
  for (let n = 2; n < 60; n++) {
    let query = supabase().from(table).select('id').eq('slug', candidate);
    if (excludeId) query = query.neq('id', excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
    candidate = `${root}-${n}`;
  }
  return `${root}-${Date.now()}`;
}
