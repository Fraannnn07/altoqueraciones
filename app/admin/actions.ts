'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE } from '@/lib/admin-session';

export async function logoutAction() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/admin', maxAge: 0 });
  redirect('/admin/login/');
}
