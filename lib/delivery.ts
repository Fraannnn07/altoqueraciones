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
] as const;

export const deliveryInfo = {
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
  'Envío sin costo lunes a miércoles en barrios seleccionados de Montevideo. Retiro sin costo jueves y viernes en zona Mercado Modelo, previa coordinación.';
