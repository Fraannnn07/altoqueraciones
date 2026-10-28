import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE, sessionUser } from '@/lib/admin-session';

/** Usuario logueado en el admin, o null. */
export async function adminUser(): Promise<string | null> {
  const store = await cookies();
  return sessionUser(store.get(ADMIN_COOKIE)?.value);
}

export async function isAdmin(): Promise<boolean> {
  return (await adminUser()) !== null;
}

/** Debe llamarse al principio de cada Server Action y página del admin: ocultar el formulario no es un límite de seguridad. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect('/admin/login/');
}
