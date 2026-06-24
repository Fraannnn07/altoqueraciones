// Cliente Supabase con service_role — SOLO se usa en funciones serverless (servidor).
// Nunca exponer SUPABASE_SERVICE_ROLE_KEY en el HTML/cliente.
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  // No tiramos error al importar para no romper el build; se valida al usar.
  console.warn('[db] Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.');
}

export const supabase = createClient(url || '', key || '', {
  auth: { persistSession: false },
});
