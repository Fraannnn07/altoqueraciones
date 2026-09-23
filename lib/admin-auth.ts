import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-session';

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

/** Debe llamarse al principio de cada Server Action y página del admin: ocultar el formulario no es un límite de seguridad. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect('/admin/login/');
}
