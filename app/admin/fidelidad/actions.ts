'use server';

import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { hashCodigo, nuevoCodigoAcceso } from '@/lib/fidelidad/acceso';
import { META_SELLOS, mensajeCodigo, urlIngreso, whatsappCliente } from '@/lib/fidelidad/config';
import {
  actualizarDatos,
  aplicarAccion,
  borrarTarjeta,
  crearTarjeta,
  esUuid,
  guardarCodigoAcceso,
  normalizarTelefono,
  tarjetaPorId,
  type Accion,
  type Tarjeta,
} from '@/lib/fidelidad/db';
import { sincronizarWallets } from '@/lib/fidelidad/sync';

/** Código recién generado: se muestra una sola vez (en la base queda solo el hash). */
export interface NewAccessCode {
  cardId: string;
  name: string;
  code: string;
  loginUrl: string;
  whatsappUrl: string;
}

function newAccessCode(card: Tarjeta, code: string, isNewCard: boolean): NewAccessCode {
  return {
    cardId: card.id,
    name: card.name,
    code,
    loginUrl: urlIngreso(card.phone, code),
    whatsappUrl: whatsappCliente(card.phone, mensajeCodigo(card.name, card.phone, code, isNewCard)),
  };
}

function revalidateLoyaltyAdmin() {
  revalidatePath('/admin/fidelidad', 'layout');
}

function cleanName(value: FormDataEntryValue | null): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

// ---------------------------------------------------------------- asignar tarjeta

export interface CreateCardState {
  error?: string;
  /** El celular ya tenía tarjeta: se ofrece abrirla. */
  existingId?: string;
  created?: NewAccessCode;
}

export async function createLoyaltyCardAction(_prev: CreateCardState, formData: FormData): Promise<CreateCardState> {
  await requireAdmin();

  const name = cleanName(formData.get('name'));
  const phone = normalizarTelefono(String(formData.get('phone') ?? ''));
  if (name.length < 2) return { error: 'Escribí el nombre del cliente.' };
  if (name.length > 60) return { error: 'El nombre admite hasta 60 caracteres.' };
  if (!phone) return { error: 'Revisá el celular: tiene que ser tipo 099 123 456.' };

  const code = nuevoCodigoAcceso();
  try {
    const { tarjeta, nueva } = await crearTarjeta(name, phone, await hashCodigo(code));
    if (!nueva) return { error: `Ese celular ya tiene tarjeta, a nombre de ${tarjeta.name}.`, existingId: tarjeta.id };
    revalidateLoyaltyAdmin();
    return { created: newAccessCode(tarjeta, code, true) };
  } catch (error) {
    console.error('[fidelidad admin] alta', error);
    return { error: 'No se pudo crear la tarjeta. Probá de nuevo.' };
  }
}

// ---------------------------------------------------------------- sellos

export interface StampResult {
  error?: string;
  message?: string;
}

const ACTIONS: Accion[] = ['stamp', 'unstamp', 'redeem'];

export async function stampAction(id: string, action: Accion): Promise<StampResult> {
  await requireAdmin();
  if (!esUuid(id) || !ACTIONS.includes(action)) return { error: 'Pedido inválido.' };

  const current = await tarjetaPorId(id);
  if (!current) return { error: 'No encontramos esa tarjeta.' };
  if (action === 'stamp' && current.stamps >= META_SELLOS) {
    return { error: 'La tarjeta está completa. Canjeá el premio primero.' };
  }
  if (action === 'redeem' && current.stamps < META_SELLOS) return { error: 'Todavía no llegó al premio.' };

  const card = await aplicarAccion(id, action, META_SELLOS);
  if (!card) return { error: 'No se pudo actualizar. Recargá la página y probá de nuevo.' };

  // Los wallets se actualizan después de responder, así el panel no espera.
  after(() => sincronizarWallets(card));
  revalidateLoyaltyAdmin();

  const stamps = Math.min(card.stamps, META_SELLOS);
  const messages: Record<Accion, string> = {
    stamp: `Sello sumado: ${stamps}/${META_SELLOS}`,
    unstamp: `Sello quitado: ${stamps}/${META_SELLOS}`,
    redeem: 'Premio canjeado. La tarjeta arranca de nuevo.',
  };
  return { message: messages[action] };
}

// ---------------------------------------------------------------- código de acceso

export interface AccessCodeState {
  error?: string;
  generated?: NewAccessCode;
}

export async function newAccessCodeAction(_prev: AccessCodeState, formData: FormData): Promise<AccessCodeState> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const card = esUuid(id) ? await tarjetaPorId(id) : null;
  if (!card) return { error: 'No encontramos esa tarjeta.' };

  const code = nuevoCodigoAcceso();
  try {
    await guardarCodigoAcceso(card.id, await hashCodigo(code));
  } catch (error) {
    console.error('[fidelidad admin] código', error);
    return { error: 'No se pudo generar el código. Probá de nuevo.' };
  }
  revalidateLoyaltyAdmin();
  // Si la tarjeta nunca tuvo código (las del alta vieja), el mensaje es el de bienvenida.
  return { generated: newAccessCode(card, code, !card.access_code_hash) };
}

// ---------------------------------------------------------------- datos del cliente

export interface CardDataState {
  error?: string;
  ok?: boolean;
}

export async function updateLoyaltyCardAction(_prev: CardDataState, formData: FormData): Promise<CardDataState> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const name = cleanName(formData.get('name'));
  const phone = normalizarTelefono(String(formData.get('phone') ?? ''));
  if (!esUuid(id)) return { error: 'Tarjeta inválida.' };
  if (name.length < 2) return { error: 'Escribí el nombre del cliente.' };
  if (name.length > 60) return { error: 'El nombre admite hasta 60 caracteres.' };
  if (!phone) return { error: 'Revisá el celular: tiene que ser tipo 099 123 456.' };

  try {
    if ((await actualizarDatos(id, name, phone)) === 'duplicado') {
      return { error: 'Ese celular ya es de otra tarjeta.' };
    }
  } catch (error) {
    console.error('[fidelidad admin] datos', error);
    return { error: 'No se pudo guardar. Probá de nuevo.' };
  }
  revalidateLoyaltyAdmin();
  return { ok: true };
}

export async function deleteLoyaltyCardAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (esUuid(id)) await borrarTarjeta(id);
  revalidateLoyaltyAdmin();
  redirect('/admin/fidelidad/');
}
