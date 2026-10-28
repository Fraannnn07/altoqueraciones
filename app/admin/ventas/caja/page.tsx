import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import {
  EMPTY_PERIOD,
  getDailyPaymentTotals,
  getDailyTotals,
  groupDays,
  sumDays,
  sumPayments,
  type PeriodTotals,
} from '@/lib/admin-sales';
import { SalesPeriodCard } from '@/components/admin/SalesPeriodCard';
import { cardClass } from '@/components/admin/ui';
import { formatUyu } from '@/lib/format';
import {
  addDays,
  addMonths,
  dayLabel,
  marginPercent,
  monthLabel,
  nextMonthStart,
  paymentLabel,
  todayInMontevideo,
  weekLabel,
  weekStart,
} from '@/lib/sales';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;
type View = 'dia' | 'semana' | 'mes';

const VIEWS: { value: View; label: string }[] = [
  { value: 'dia', label: 'Por día' },
  { value: 'semana', label: 'Por semana' },
  { value: 'mes', label: 'Por mes' },
];

const WEEKS_SHOWN = 12;

interface Row {
  key: string;
  label: string;
  totals: PeriodTotals;
  current: boolean;
}

function param(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : '';
}

export default async function AdminCashPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const today = todayInMontevideo();
  const thisMonth = today.slice(0, 7);
  const view: View = VIEWS.some((v) => v.value === params.vista) ? (params.vista as View) : 'dia';

  // Mes elegido (vista por día) o año elegido (vista por mes); nunca en el futuro.
  const rawMonth = param(params.mes);
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(rawMonth) && rawMonth <= thisMonth ? rawMonth : thisMonth;
  const rawYear = param(params.anio);
  const year = /^\d{4}$/.test(rawYear) && rawYear <= today.slice(0, 4) ? rawYear : today.slice(0, 4);

  let from: string;
  let to: string;
  let periodLabel: string;
  if (view === 'dia') {
    from = `${month}-01`;
    to = [addDays(nextMonthStart(month), -1), today].sort()[0];
    periodLabel = monthLabel(month);
  } else if (view === 'semana') {
    from = addDays(weekStart(today), -7 * (WEEKS_SHOWN - 1));
    to = today;
    periodLabel = `Últimas ${WEEKS_SHOWN} semanas`;
  } else {
    from = `${year}-01-01`;
    to = [`${year}-12-31`, today].sort()[0];
    periodLabel = `Año ${year}`;
  }

  const [days, payments] = await Promise.all([getDailyTotals(from, to), getDailyPaymentTotals(from, to)]);
  const periodTotals = sumDays(days);

  const rows: Row[] = [];
  if (view === 'dia') {
    const byDay = new Map(days.map((day) => [day.day, day]));
    for (let day = to; day >= from; day = addDays(day, -1)) {
      const totals = byDay.has(day) ? sumDays([byDay.get(day)!]) : EMPTY_PERIOD;
      rows.push({ key: day, label: dayLabel(day), totals, current: day === today });
    }
  } else if (view === 'semana') {
    const byWeek = groupDays(days, weekStart);
    for (let start = weekStart(today); start >= from; start = addDays(start, -7)) {
      rows.push({ key: start, label: weekLabel(start), totals: byWeek.get(start) ?? EMPTY_PERIOD, current: start === weekStart(today) });
    }
  } else {
    const byMonth = groupDays(days, (day) => day.slice(0, 7));
    for (let m = to.slice(0, 7); m >= `${year}-01`; m = addMonths(m, -1)) {
      rows.push({ key: m, label: monthLabel(m), totals: byMonth.get(m) ?? EMPTY_PERIOD, current: m === thisMonth });
    }
  }

  const navigation =
    view === 'dia'
      ? {
          prev: { href: `?vista=dia&mes=${addMonths(month, -1)}`, label: monthLabel(addMonths(month, -1)) },
          next: month < thisMonth ? { href: `?vista=dia&mes=${addMonths(month, 1)}`, label: monthLabel(addMonths(month, 1)) } : null,
        }
      : view === 'mes'
        ? {
            prev: { href: `?vista=mes&anio=${Number(year) - 1}`, label: String(Number(year) - 1) },
            next: year < today.slice(0, 4) ? { href: `?vista=mes&anio=${Number(year) + 1}`, label: String(Number(year) + 1) } : null,
          }
        : null;

  return (
    <div>
      <Link href="/admin/ventas/" className="text-sm font-semibold text-brand-green-dark hover:underline">
        ← Ventas
      </Link>
      <h1 className="mt-2 font-display text-2xl font-bold text-gray-900">Caja</h1>
      <p className="mt-1 max-w-3xl text-sm text-gray-600">
        Lo vendido y la ganancia de cada período, sin las ventas anuladas. La semana va de lunes a domingo. La ganancia
        cuenta solo las ventas que tienen el costo de todos sus productos cargado.
      </p>

      <nav aria-label="Agrupar la caja" className="mt-6 inline-flex rounded-xl border border-black/10 bg-white p-1 text-sm font-semibold">
        {VIEWS.map((v) => (
          <Link
            key={v.value}
            href={`?vista=${v.value}`}
            aria-current={v.value === view ? 'page' : undefined}
            className={`rounded-lg px-3 py-1.5 ${v.value === view ? 'bg-brand-green text-white' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            {v.label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-gray-900">{periodLabel}</h2>
        {navigation ? (
          <div className="flex gap-4 text-sm font-semibold text-brand-green-dark">
            <Link href={navigation.prev.href} className="hover:underline">
              ← {navigation.prev.label}
            </Link>
            {navigation.next ? (
              <Link href={navigation.next.href} className="hover:underline">
                {navigation.next.label} →
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <SalesPeriodCard title={`Total · ${periodLabel}`} totals={periodTotals} />
        <div className={cardClass}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Por medio de pago</p>
          {payments.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600">Sin ventas en este período.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {sumPayments(payments).map((payment) => (
                <li key={payment.method} className="flex justify-between gap-3">
                  <span className="text-gray-700">
                    {paymentLabel(payment.method)}{' '}
                    <span className="text-gray-500">
                      ({payment.sales} {payment.sales === 1 ? 'venta' : 'ventas'})
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums text-gray-900">{formatUyu(payment.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <section className={`${cardClass} mt-6 overflow-x-auto p-0`}>
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">{view === 'dia' ? 'Día' : view === 'semana' ? 'Semana' : 'Mes'}</th>
              <th className="px-4 py-3 text-right">Ventas</th>
              <th className="px-4 py-3 text-right">Vendido</th>
              <th className="px-4 py-3 text-right">Ganancia</th>
              <th className="px-4 py-3 text-right">Margen</th>
              <th className="px-4 py-3 text-right">Ticket prom.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rows.map((row) => {
              const { totals } = row;
              const empty = totals.sales === 0;
              const margin = marginPercent(totals.profit, totals.totalWithCost);
              return (
                <tr key={row.key} className={`${empty ? 'text-gray-400' : 'text-gray-900'} ${row.current ? 'bg-brand-green-light/50' : ''}`}>
                  <td className="px-4 py-2.5 font-semibold">
                    {row.label}
                    {row.current ? <span className="ml-2 text-xs font-bold text-brand-green-dark">actual</span> : null}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{empty ? '—' : totals.sales}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{empty ? '—' : formatUyu(totals.total)}</td>
                  <td
                    className={`px-4 py-2.5 text-right tabular-nums ${!empty && totals.profit < 0 ? 'text-red-700' : ''} ${
                      !empty && totals.profit > 0 ? 'text-brand-green-dark' : ''
                    }`}
                  >
                    {empty ? '—' : formatUyu(totals.profit)}
                    {!empty && totals.salesWithoutCost > 0 ? (
                      <span className="text-gray-400" title={`${totals.salesWithoutCost} sin costo cargado`}>
                        {' '}
                        *
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{empty || margin === null ? '—' : `${margin}%`}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {empty ? '—' : formatUyu(Math.round(totals.total / totals.sales))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      {periodTotals.salesWithoutCost > 0 ? (
        <p className="mt-2 text-xs text-gray-500">
          * Hay ventas sin el costo de todos sus productos: no entran en la ganancia ni en el margen. Cargá los costos en{' '}
          <Link href="/admin/ventas/costos/" className="font-semibold text-brand-green-dark hover:underline">
            Costos
          </Link>{' '}
          y editá esas ventas para completarlas.
        </p>
      ) : null}
    </div>
  );
}
