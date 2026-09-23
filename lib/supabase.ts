import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Cliente único con la service role key. Nunca se expone al navegador: este
// archivo importa "server-only", así que cualquier intento de usarlo desde un
// Client Component falla en build, no en runtime.
//
// Sin genérico <Database>: los tipos de fila viven en lib/database.types.ts y
// se castean a mano en cada función de lib/data/*.ts. Evita que la inferencia
// de supabase-js colapse a `never` con un schema escrito a mano (no generado
// vía `supabase gen types`). Reemplazar por un cliente tipado cuando el
// proyecto esté linkeado y se puedan generar los tipos reales.
function createServiceRoleClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.');
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

let cached: ReturnType<typeof createServiceRoleClient> | null = null;

export function supabase() {
  if (!cached) cached = createServiceRoleClient();
  return cached;
}
