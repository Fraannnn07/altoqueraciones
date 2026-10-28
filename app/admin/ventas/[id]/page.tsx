import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { getSale } from '@/lib/admin-sales';
import { telefonoLegible, whatsappCliente } from '@/lib/fidelidad/config';
import { deleteSaleAction, setSaleVoidedAction } from '../actions';
import { ConfirmSubmitButton } from '@/components/admin/ConfirmSubmitButton';
import { SaleReceiptActions } from '@/components/admin/SaleReceiptActions';
import { cardClass, dangerButtonClass, secondaryButtonClass } from '@/components/admin/ui';
import { formatUyu } from '@/lib/format';
import { formatSaleNumber, marginPercent, paymentLabel, receiptFileName, saleDateFormatter } from '@/lib/sales';
import { siteConfig } from '@/lib/site-config';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AdminSalePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  await requireAdmin();
  const { id } = await params;
  const sale = await getSale(Number(id));
  if (!sale) notFound();
  const justCreated = (await searchParams).nueva === '1';

  const number = formatSaleNumber(sale.number);
  const firstName = sale.customer_name.split(' ')[0];
  const whatsappUrl = sale.customer_phone
    ? whatsappCliente(
        sale.customer_phone,
        `¡Hola${firstName ? ` ${firstName}` : ''}! Te paso el comprobante de tu compra en ${siteConfig.name} (Nº ${number}, total ${formatUyu(sale.total_uyu)}). ¡Gracias!`,
      )
    : null;
  const profit = sale.cost_complete ? sale.total_uyu - sale.cost_uyu : null;
  const margin = profit !== null ? marginPercent(profit, sale.total_uyu) : null;
  const missingCosts = sale.items.filter((item) => item.unit_cost_uyu === null).length;

  return (
    <div className="space-y-6">
      <Link href="/admin/ventas/" className="text-sm font-semibold text-brand-green-dark hover:underline">
        ← Ventas
      </Link>

      {justCreated ? (
        <p role="status" className="rounded-xl bg-brand-green-light p-4 text-sm font-semibold text-brand-green-dark">
          Venta guardada. Ya podés mandarle el comprobante al cliente.
        </p>
      ) : null}

      <section className={cardClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">
              Venta Nº {number}
              {sale.voided ? (
                <span className="ml-3 rounded-full bg-red-50 px-2.5 py-0.5 align-middle text-sm font-bold text-red-700">
                  Anulada
                </span>
              ) : null}
            </h1>
            <p className="text-sm text-gray-600">
              {saleDateFormatter.format(new Date(sale.sold_at))} · {paymentLabel(sale.payment_method)}
            </p>
            <p className="mt-1 text-sm text-gray-900">
              {sale.customer_name || 'Consumidor final'}
              {sale.customer_phone ? <span className="text-gray-500"> · {telefonoLegible(sale.customer_phone)}</span> : null}
            </p>
          </div>
          <p className={`font-display text-3xl font-bold tabular-nums text-gray-900 ${sale.voided ? 'line-through' : ''}`}>
            {formatUyu(sale.total_uyu)}
          </p>
        </div>

        <div className="mt-5 border-t border-black/5 pt-5">
          <SaleReceiptActions
            pdfUrl={`/admin/ventas/${sale.id}/comprobante/`}
            fileName={receiptFileName(sale)}
            shareText={`Comprobante Nº ${number} de ${siteConfig.name}. ¡Gracias por tu compra!`}
            whatsappUrl={whatsappUrl}
          />
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="font-display text-lg font-bold text-gray-900">Detalle</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-3">Producto</th>
                <th className="py-2 pr-3 text-right">Cant.</th>
                <th className="py-2 pr-3 text-right">Precio</th>
                <th className="py-2 pr-3 text-right">Costo</th>
                <th className="py-2 text-right">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {sale.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 pr-3 text-gray-900">{item.description}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{formatUyu(item.unit_price_uyu)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-gray-500">
                    {item.unit_cost_uyu === null ? 'sin cargar' : formatUyu(item.unit_cost_uyu)}
                  </td>
                  <td className="py-2 text-right font-semibold tabular-nums">{formatUyu(item.line_total_uyu)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
          {sale.discount_uyu > 0 ? (
            <>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Subtotal</dt>
                <dd className="tabular-nums">{formatUyu(sale.subtotal_uyu)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Descuento</dt>
                <dd className="tabular-nums">- {formatUyu(sale.discount_uyu)}</dd>
              </div>
            </>
          ) : null}
          <div className="flex justify-between gap-4 font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatUyu(sale.total_uyu)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-black/5 pt-1">
            <dt className="text-gray-500">Costo</dt>
            <dd className="tabular-nums text-gray-700">{formatUyu(sale.cost_uyu)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Ganancia</dt>
            <dd className={`font-bold tabular-nums ${profit !== null && profit < 0 ? 'text-red-700' : 'text-brand-green-dark'}`}>
              {profit !== null ? `${formatUyu(profit)}${margin !== null ? ` (${margin}%)` : ''}` : '—'}
            </dd>
          </div>
        </dl>
        {profit === null ? (
          <p className="mt-2 text-right text-xs text-gray-500">
            Falta el costo de {missingCosts} {missingCosts === 1 ? 'línea' : 'líneas'}: editá la venta para cargarlo y que
            entre en la ganancia.
          </p>
        ) : null}

        {sale.notes ? (
          <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            <span className="font-semibold">Nota:</span> {sale.notes}
          </p>
        ) : null}
        {sale.voided ? (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            Esta venta está anulada: no cuenta en la caja y el comprobante sale marcado como anulado.
          </p>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href={`/admin/ventas/${sale.id}/editar/`} className={secondaryButtonClass}>
          Editar
        </Link>
        <form action={setSaleVoidedAction}>
          <input type="hidden" name="id" value={sale.id} />
          <input type="hidden" name="voided" value={sale.voided ? 'false' : 'true'} />
          {sale.voided ? (
            <button type="submit" className={secondaryButtonClass}>
              Reactivar venta
            </button>
          ) : (
            <ConfirmSubmitButton
              message={`¿Anular la venta Nº ${number}? Deja de contar en la caja, pero queda registrada.`}
              className={secondaryButtonClass}
            >
              Anular venta
            </ConfirmSubmitButton>
          )}
        </form>
        <form action={deleteSaleAction}>
          <input type="hidden" name="id" value={sale.id} />
          <ConfirmSubmitButton
            message={`¿Borrar la venta Nº ${number} para siempre? Usalo solo para errores de carga; si ya mandaste el comprobante, mejor anulala.`}
            className={dangerButtonClass}
          >
            Borrar
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}
