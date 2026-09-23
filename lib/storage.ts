import 'server-only';

const BUCKET = 'product-images';

/** URL pública de un archivo del bucket "product-images", o null si no hay path. */
export function storageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = process.env.SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}
