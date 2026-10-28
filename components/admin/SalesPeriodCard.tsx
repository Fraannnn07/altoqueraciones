import type { PeriodTotals } from '@/lib/admin-sales';
import { cardClass } from '@/components/admin/ui';
import { formatUyu } from '@/lib/format';
import { marginPercent } from '@/lib/sales';

/** Tarjeta de caja: lo vendido en un período y la ganancia de las ventas con costo cargado. */
export function SalesPeriodCard({ title, totals, children }: { title: string; totals: PeriodTotals; children?: React.ReactNode }) {
  const margin = marginPercent(totals.profit, totals.totalWithCost);
  return (
    <div className={cardClass}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-2 font-display text-2xl font-bold tabular-nums text-gray-900">{formatUyu(totals.total)}</p>
      <p className="text-sm text-gray-600">
        {totals.sales} {totals.sales === 1 ? 'venta' : 'ventas'}
      </p>
      <p className="mt-3 text-sm">
        <span className="text-gray-500">Ganancia </span>
        <span className={`font-bold tabular-nums ${totals.profit < 0 ? 'text-red-700' : 'text-brand-green-dark'}`}>
          {formatUyu(totals.profit)}
        </span>
        {margin !== null ? <span className="text-gray-500"> · {margin}%</span> : null}
      </p>
      {totals.salesWithoutCost > 0 ? (
        <p className="mt-1 text-xs text-gray-500">
          {totals.salesWithoutCost} {totals.salesWithoutCost === 1 ? 'venta' : 'ventas'} sin costo cargado no{' '}
          {totals.salesWithoutCost === 1 ? 'entra' : 'entran'} en la ganancia.
        </p>
      ) : null}
      {children}
    </div>
  );
}
