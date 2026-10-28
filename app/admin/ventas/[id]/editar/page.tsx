import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { getSale, getSaleProducts } from '@/lib/admin-sales';
import { SaleForm } from '@/components/admin/SaleForm';
import { formatSaleNumber, toLocalInputValue } from '@/lib/sales';

export default async function AdminEditSalePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [sale, products] = await Promise.all([getSale(Number(id)), getSaleProducts()]);
  if (!sale) notFound();

  return (
    <div>
      <Link href={`/admin/ventas/${sale.id}/`} className="text-sm font-semibold text-brand-green-dark hover:underline">
        ← Venta Nº {formatSaleNumber(sale.number)}
      </Link>
      <h1 className="mt-2 font-display text-2xl font-bold text-gray-900">Editar venta Nº {formatSaleNumber(sale.number)}</h1>
      <p className="mt-1 max-w-3xl text-sm text-gray-600">
        El número no cambia. Si ya le mandaste el comprobante al cliente, mandale el nuevo después de guardar.
      </p>
      <div className="mt-6">
        <SaleForm
          products={products}
          defaultSoldAt={toLocalInputValue(new Date(sale.sold_at))}
          initial={{
            id: sale.id,
            soldAt: toLocalInputValue(new Date(sale.sold_at)),
            customerName: sale.customer_name,
            customerPhone: sale.customer_phone,
            paymentMethod: sale.payment_method,
            notes: sale.notes,
            discount: sale.discount_uyu,
            lines: sale.items.map((item) => ({
              productId: item.product_id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unit_price_uyu,
              unitCost: item.unit_cost_uyu,
            })),
          }}
        />
      </div>
    </div>
  );
}
