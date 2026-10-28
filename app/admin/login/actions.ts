'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE, ADMIN_SESSION_SECONDS, createSessionToken, verifyAdminLogin } from '@/lib/admin-session';

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!process.env.ADMIN_PASSWORD) {
    return { error: 'Falta configurar ADMIN_PASSWORD en las variables de entorno del servidor.' };
  }

  const username = String(formData.get('username') ?? '').slice(0, 60);
  const password = String(formData.get('password') ?? '').slice(0, 200);
  const user = await verifyAdminLogin(username, password);
  if (!user) {
    // Frena un poco los intentos por fuerza bruta.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { error: 'Usuario o contraseña incorrectos.' };
  }

  const token = createSessionToken(user);
  if (!token) return { error: 'No se pudo iniciar la sesión (falta configuración del servidor).' };

  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_SESSION_SECONDS,
  });
  redirect('/admin/');
}
