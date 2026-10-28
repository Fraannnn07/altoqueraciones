import Link from 'next/link';
import type { SaleListItem as SaleListRow } from '@/lib/admin-sales';
import { cardClass } from '@/components/admin/ui';
import { formatUyu } from '@/lib/format';
import { formatSaleNumber, paymentLabel, saleDateFormatter } from '@/lib/sales';

export function SaleListItem({ sale }: { sale: SaleListRow }) {
  return (
    <li>
      <Link
        href={`/admin/ventas/${sale.id}/`}
        className={`${cardClass} flex items-center justify-between gap-3 py-3 transition hover:border-brand-green/40 ${
          sale.voided ? 'opacity-60' : ''
        }`}
      >
        <div className="min-w-0">
          <p className="text-xs text-gray-500">
            Nº {formatSaleNumber(sale.number)} · {saleDateFormatter.format(new Date(sale.sold_at))}
            {sale.voided ? <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 font-bold text-red-700">Anulada</span> : null}
          </p>
          <p className="truncate font-semibold text-gray-900">{sale.customer_name || 'Consumidor final'}</p>
          <p className="truncate text-sm text-gray-500">{sale.itemsSummary}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`font-display text-lg font-bold tabular-nums text-gray-900 ${sale.voided ? 'line-through' : ''}`}>
            {formatUyu(sale.total_uyu)}
          </p>
          <p className="text-xs text-gray-500">{paymentLabel(sale.payment_method)}</p>
        </div>
      </Link>
    </li>
  );
}
