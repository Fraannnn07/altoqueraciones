import 'server-only';

/**
 * Ejecuta una carga de datos que no debe tumbar el build ni una página entera
 * si Supabase está caído o mal configurado: loguea y devuelve el fallback.
 * Usar solo en generateStaticParams (donde dynamicParams=true ya cubre el
 * caso real) y en datos globales del layout (nav) que no son el contenido
 * principal de la página.
 */
export async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error('[data] fallo al cargar datos, usando fallback:', error);
    return fallback;
  }
}
