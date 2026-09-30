import 'server-only';
import { cache } from 'react';
import { supabase } from '@/lib/supabase';
import type { PricingRules } from '@/lib/pricing';

export interface SiteDiscount {
  active: boolean;
  percent: number;
  /** Texto propio para la barra animada del inicio; '' = se arma solo con el porcentaje. */
  message: string;
  /** Redondear el precio con descuento (general o por producto) a la decena. */
  roundToTen: boolean;
}

const NO_DISCOUNT: SiteDiscount = { active: false, percent: 0, message: '', roundToTen: false };

/**
 * Descuento general de la tienda (fila única de site_settings). Con `cache`, una página que
 * arma varias listas de productos consulta la base una sola vez. Si la consulta falla, la
 * tienda sigue andando con los precios de lista.
 */
export const getSiteDiscount = cache(async (): Promise<SiteDiscount> => {
  const { data, error } = await supabase()
    .from('site_settings')
    .select('site_discount_active, site_discount_percent, site_discount_message, discount_round_to_ten')
    .eq('id', 1)
    .maybeSingle();
  if (error) console.error('[data] no se pudo leer el descuento general:', error.message);
  if (!data) return NO_DISCOUNT;
  return {
    active: data.site_discount_active,
    percent: data.site_discount_percent,
    message: data.site_discount_message,
    roundToTen: data.discount_round_to_ten,
  };
});

/** Lo que hace falta para calcular cualquier precio hoy: descuento general vigente y redondeo. */
export async function getPricingRules(): Promise<PricingRules> {
  const discount = await getSiteDiscount();
  return { sitePercent: discount.active ? discount.percent : 0, roundToTen: discount.roundToTen };
}
