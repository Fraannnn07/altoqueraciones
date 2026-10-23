// Fuente única de la política de entregas: se referencia desde el home, /envios/,
// preguntas frecuentes, footer y datos estructurados. Cambiar acá alcanza para
// actualizar todo el sitio.

export const deliveryZones = [
  'Reducto',
  'Jacinto Vera',
  'La Blanqueada',
  'Parque Batlle',
  'Pocitos',
  'Punta Carretas',
  'Cordón',
  'Tres Cruces',
  'La Comercial',
  'Aguada',
  'Centro',
  'Palermo',
  'Ciudad Vieja',
  'Parque Rodó',
  'Barrio Sur',
  'Villa Española',
  'Malvín',
  'Carrasco',
] as const;

export const deliveryInfo = {
  /** Plazo de entrega a domicilio (confirmado por el dueño el 2026-10-22). */
  leadTimeLabel: '24 horas',
  freeDeliveryDaysLabel: 'lunes a miércoles',
  zones: deliveryZones,
  pickup: {
    daysLabel: 'jueves y viernes',
    area: 'Mercado Modelo',
    note: 'previa coordinación',
  },
} as const;

/** Resumen corto para hero/tarjetas. */
export const deliverySummary =
  'Te lo llevamos a la puerta de tu casa en 24 horas. Envío sin costo de lunes a miércoles en barrios seleccionados de Montevideo, o retiro sin costo jueves y viernes en zona Mercado Modelo, previa coordinación.';
