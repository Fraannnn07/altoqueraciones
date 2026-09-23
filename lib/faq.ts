// Fuente única de las preguntas frecuentes: se usa en /preguntas-frecuentes/
// completa y en un extracto en el home, para no duplicar contenido.

export interface FaqEntry {
  question: string;
  answer: string;
}

export const siteFaq: FaqEntry[] = [
  {
    question: '¿En qué barrios tienen envío gratis?',
    answer:
      'El envío sin costo está disponible en Reducto, Jacinto Vera, La Blanqueada, Parque Batlle, Pocitos, Punta Carretas, Cordón, Tres Cruces, La Comercial, Aguada, Centro, Palermo, Ciudad Vieja, Parque Rodó, Barrio Sur y Villa Española.',
  },
  {
    question: '¿Qué días realizan entregas?',
    answer: 'Entregamos de lunes a miércoles en los barrios con envío sin costo.',
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
    answer: 'Sí, escribinos por WhatsApp y te confirmamos disponibilidad y costo de envío para tu zona.',
  },
];
