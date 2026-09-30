import 'server-only';
import { cache } from 'react';
import { supabase } from '@/lib/supabase';

export interface SiteDiscount {
  active: boolean;
  percent: number;
  /** Texto propio para la barra animada del inicio; '' = se arma solo con el porcentaje. */
  message: string;
}

const NO_DISCOUNT: SiteDiscount = { active: false, percent: 0, message: '' };

/**
 * Descuento general de la tienda (fila única de site_settings). Con `cache`, una página que
 * arma varias listas de productos consulta la base una sola vez. Si la consulta falla, la
 * tienda sigue andando con los precios de lista.
 */
export const getSiteDiscount = cache(async (): Promise<SiteDiscount> => {
  const { data, error } = await supabase()
    .from('site_settings')
    .select('site_discount_active, site_discount_percent, site_discount_message')
    .eq('id', 1)
    .maybeSingle();
  if (error) console.error('[data] no se pudo leer el descuento general:', error.message);
  if (!data) return NO_DISCOUNT;
  return {
    active: data.site_discount_active,
    percent: data.site_discount_percent,
    message: data.site_discount_message,
  };
});

/** Porcentaje que se aplica hoy a todo el catálogo (0 si el descuento general está apagado). */
export async function getSiteDiscountPercent(): Promise<number> {
  const discount = await getSiteDiscount();
  return discount.active ? discount.percent : 0;
}
