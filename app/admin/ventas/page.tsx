import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import {
  getDailyPaymentTotals,
  getDailyTotals,
  getRecentSales,
  searchSales,
  sumDays,
  sumPayments,
  SEARCH_LIMIT,
  type SaleSearch,
} from '@/lib/admin-sales';
import { SaleListItem } from '@/components/admin/SaleListItem';
import { SalesPeriodCard } from '@/components/admin/SalesPeriodCard';
import { cardClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '@/components/admin/ui';
import { formatUyu } from '@/lib/format';
import {
  PAYMENT_METHOD_VALUES,
  PAYMENT_METHODS,
  isIsoDay,
  marginPercent,
  monthStart,
  paymentLabel,
  todayInMontevideo,
  weekStart,
} from '@/lib/sales';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/** Una búsqueda muestra hasta esta cantidad de ventas; los totales cuentan todas. */
const LIST_LIMIT = 200;

function param(value: string | string[] | undefined): string {
  return (typeof value === 'string' ? value : '').trim();
}

export default async function AdminSalesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const search: SaleSearch = {
    q: param(params.q).slice(0, 80),
    from: isIsoDay(param(params.desde)) ? param(params.desde) : '',
    to: isIsoDay(param(params.hasta)) ? param(params.hasta) : '',
    payment: (PAYMENT_METHOD_VALUES as string[]).includes(param(params.pago)) ? param(params.pago) : '',
  };
  const searching = Boolean(search.q || search.from || search.to || search.payment);

  const today = todayInMontevideo();
  const thisWeek = weekStart(today);
  const thisMonth = monthStart(today);
  const [days, todayPayments, results, recent] = await Promise.all([
    getDailyTotals(thisWeek < thisMonth ? thisWeek : thisMonth, today),
    getDailyPaymentTotals(today, today),
    searching ? searchSales(search) : null,
    searching ? null : getRecentSales(30),
  ]);

  const todayTotals = sumDays(days.filter((day) => day.day === today));
  const weekTotals = sumDays(days.filter((day) => day.day >= thisWeek));
  const monthTotals = sumDays(days.filter((day) => day.day >= thisMonth));

  const activeResults = results?.sales.filter((sale) => !sale.voided) ?? [];
  const resultsTotal = activeResults.reduce((sum, sale) => sum + sale.total_uyu, 0);
  const withCost = activeResults.filter((sale) => sale.cost_complete);
  const resultsProfit = withCost.reduce((sum, sale) => sum + sale.total_uyu - sale.cost_uyu, 0);
  const resultsMargin = marginPercent(resultsProfit, withCost.reduce((sum, sale) => sum + sale.total_uyu, 0));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-gray-900">Ventas</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/ventas/caja/" className={secondaryButtonClass}>
            Caja por día, semana y mes
          </Link>
          <Link href="/admin/ventas/costos/" className={secondaryButtonClass}>
            Costos
          </Link>
          <Link href="/admin/ventas/nueva/" className={primaryButtonClass}>
            Nueva venta
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <SalesPeriodCard title="Hoy" totals={todayTotals}>
          {todayPayments.length > 0 ? (
            <ul className="mt-3 space-y-0.5 border-t border-black/5 pt-2 text-xs text-gray-600">
              {sumPayments(todayPayments).map((payment) => (
                <li key={payment.method} className="flex justify-between gap-2">
                  <span>{paymentLabel(payment.method)}</span>
                  <span className="font-semibold tabular-nums text-gray-900">{formatUyu(payment.total)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </SalesPeriodCard>
        <SalesPeriodCard title="Esta semana" totals={weekTotals} />
        <SalesPeriodCard title="Este mes" totals={monthTotals} />
      </div>

      <section className={`${cardClass} mt-6`}>
        <form action="/admin/ventas/" className="grid gap-3 sm:grid-cols-2 sm:items-end lg:grid-cols-[1fr_9.5rem_9.5rem_9.5rem_auto]">
          <div>
            <label htmlFor="sales_q" className={labelClass}>
              Buscar
            </label>
            <input
              id="sales_q"
              name="q"
              type="search"
              defaultValue={search.q}
              placeholder="Cliente, celular, producto o Nº"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="sales_from" className={labelClass}>
              Desde
            </label>
            <input id="sales_from" name="desde" type="date" defaultValue={search.from} className={inputClass} />
          </div>
          <div>
            <label htmlFor="sales_to" className={labelClass}>
              Hasta
            </label>
            <input id="sales_to" name="hasta" type="date" defaultValue={search.to} className={inputClass} />
          </div>
          <div>
            <label htmlFor="sales_payment" className={labelClass}>
              Pago
            </label>
            <select id="sales_payment" name="pago" defaultValue={search.payment} className={inputClass}>
              <option value="">Todos</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={secondaryButtonClass}>
            Buscar
          </button>
        </form>
      </section>

      {results ? (
        <>
          <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-gray-900">
              {results.sales.length} {results.sales.length === 1 ? 'venta encontrada' : 'ventas encontradas'}
            </h2>
            <Link href="/admin/ventas/" className="text-sm font-semibold text-brand-green-dark hover:underline">
              Limpiar búsqueda
            </Link>
          </div>
          {results.sales.length > 0 ? (
            <p className="mt-1 text-sm text-gray-600">
              Total {formatUyu(resultsTotal)} · ganancia {formatUyu(resultsProfit)}
              {resultsMargin !== null ? ` (${resultsMargin}%)` : ''}
              {activeResults.length < results.sales.length ? ' · sin contar las anuladas' : ''}
              {withCost.length < activeResults.length
                ? ` · ${activeResults.length - withCost.length} sin costo cargado no entran en la ganancia`
                : ''}
            </p>
          ) : null}
          {results.truncated ? (
            <p className="mt-2 rounded-lg bg-brand-orange-light p-3 text-sm text-gray-800">
              Hay más de {SEARCH_LIMIT} ventas que coinciden: los totales son de las {SEARCH_LIMIT} más nuevas. Acotá las
              fechas para verlas todas.
            </p>
          ) : null}
        </>
      ) : (
        <h2 className="mt-8 font-display text-lg font-bold text-gray-900">Últimas ventas</h2>
      )}

      {(results?.sales ?? recent ?? []).length === 0 ? (
        <p className={`${cardClass} mt-3 text-sm text-gray-600`}>
          {searching ? 'No hay ventas que coincidan.' : 'Todavía no hay ventas. Cargá la primera con “Nueva venta”.'}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {(results?.sales ?? recent ?? []).slice(0, LIST_LIMIT).map((sale) => (
            <SaleListItem key={sale.id} sale={sale} />
          ))}
        </ul>
      )}
      {results && results.sales.length > LIST_LIMIT ? (
        <p className="mt-3 text-sm text-gray-600">
          Se muestran las {LIST_LIMIT} más nuevas. Acotá la búsqueda para ver las demás.
        </p>
      ) : null}
    </div>
  );
}
