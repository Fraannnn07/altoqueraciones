// Fuente única de las preguntas frecuentes: se usa en /preguntas-frecuentes/
// completa y en un extracto en el home, para no duplicar contenido.

import { deliveryInfo, deliveryZones } from '@/lib/delivery';
import { rewardsSummary } from '@/lib/store-promises';

export interface FaqEntry {
  question: string;
  answer: string;
}

export const siteFaq: FaqEntry[] = [
  {
    question: '¿Cuánto tarda en llegar mi pedido?',
    answer: `Te lo llevamos a la puerta de tu casa en ${deliveryInfo.leadTimeLabel}. Coordinamos la entrega por WhatsApp cuando confirmás el pedido.`,
  },
  {
    question: '¿Tienen regalos o descuentos?',
    answer: `Sí. ${rewardsSummary}`,
  },
  {
    question: '¿En qué barrios tienen envío gratis?',
    answer: `El envío sin costo está disponible en ${deliveryZones.slice(0, -1).join(', ')} y ${deliveryZones[deliveryZones.length - 1]}.`,
  },
  {
    question: '¿Qué días el envío es sin costo?',
    answer: `De ${deliveryInfo.freeDeliveryDaysLabel}, en los barrios con envío sin costo.`,
  },
  {
    question: '¿Dónde y cuándo puedo retirar mi pedido?',
    answer:
      'Podés retirar sin costo los jueves y viernes en la zona de Mercado Modelo, coordinando el horario por WhatsApp.',
  },
  {
    question: '¿Cómo consulto por un producto?',
    answer:
      'Entrá a la ficha del producto que te interesa y tocá "Consultar por WhatsApp": se abre un mensaje con ese producto ya cargado para que sigamos la conversación ahí.',
  },
  {
    question: '¿Cuántos kilos incluye cada combo?',
    answer:
      'Cada ficha de producto indica el total de kilos exacto (por ejemplo, el combo Natural Dog trae 22+9 kg, 31 kg en total). Revisá la ficha de cada producto en el catálogo para ver el detalle y el precio por kilo.',
  },
  {
    question: '¿Puedo consultar por entregas fuera de los barrios indicados?',
    answer:
      'Sí, llegamos a todo Montevideo. Fuera de los barrios con envío sin costo, escribinos por WhatsApp y te confirmamos el costo de envío para tu zona.',
  },
];
