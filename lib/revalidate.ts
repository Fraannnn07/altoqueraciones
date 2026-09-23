import 'server-only';
import { revalidatePath } from 'next/cache';

/** Invalida todas las páginas públicas (y sitemap/feed) después de guardar algo desde el admin. */
export function revalidateStorefront() {
  revalidatePath('/', 'layout');
  revalidatePath('/sitemap.xml');
  revalidatePath('/feed/google-shopping.xml');
}
