'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_SECONDS,
  createSessionToken,
  isAdminPasswordValid,
} from '@/lib/admin-session';

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!process.env.ADMIN_PASSWORD) {
    return { error: 'Falta configurar ADMIN_PASSWORD en las variables de entorno del servidor.' };
  }

  const password = String(formData.get('password') ?? '');
  if (!isAdminPasswordValid(password)) {
    // Frena un poco los intentos por fuerza bruta.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { error: 'Contraseña incorrecta.' };
  }

  const token = createSessionToken();
  if (!token) return { error: 'No se pudo iniciar la sesión (falta configuración del servidor).' };

  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/admin',
    maxAge: ADMIN_SESSION_SECONDS,
  });
  redirect('/admin/');
}
