// Fuente única de lo que prometemos en cada pedido (confirmado por el dueño el 2026-10-22): entrega en la
// puerta en 24 horas, regalo en cada pedido y el descuento de la tarjeta de sellos. Se muestra en el inicio,
// las categorías, las fichas y las preguntas frecuentes.

import { deliveryInfo } from '@/lib/delivery';
import { META_SELLOS, PREMIO } from '@/lib/fidelidad/config';

/** "10% de descuento en tu próxima bolsa" → "10% de descuento", para el título corto. */
const premioCorto = PREMIO.replace(/\s+en tu próxima bolsa$/i, '');

export const storePromises = [
  {
    id: 'entrega',
    title: `Entrega en ${deliveryInfo.leadTimeLabel}`,
    detail: 'Te lo llevamos a la puerta de tu casa.',
  },
  {
    id: 'regalo',
    title: 'Regalo en cada pedido',
    detail: 'Cada pedido lleva un regalo para tu mascota.',
  },
  {
    id: 'sellos',
    title: `Cada ${META_SELLOS} bolsas, ${premioCorto}`,
    detail: `Con tu tarjeta de sellos te llevás ${PREMIO}.`,
  },
] as const;

export type StorePromiseId = (typeof storePromises)[number]['id'];

/** Frase para preguntas frecuentes y textos: regalo + descuento por bolsas. */
export const rewardsSummary = `Cada pedido lleva un regalo para tu mascota y, con la tarjeta de sellos, cada ${META_SELLOS} bolsas te llevás ${PREMIO}.`;
