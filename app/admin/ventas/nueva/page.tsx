import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { getSaleProducts } from '@/lib/admin-sales';
import { SaleForm } from '@/components/admin/SaleForm';
import { toLocalInputValue } from '@/lib/sales';

export default async function AdminNewSalePage() {
  await requireAdmin();
  const products = await getSaleProducts();

  return (
    <div>
      <Link href="/admin/ventas/" className="text-sm font-semibold text-brand-green-dark hover:underline">
        ← Ventas
      </Link>
      <h1 className="mt-2 font-display text-2xl font-bold text-gray-900">Nueva venta</h1>
      <p className="mt-1 max-w-3xl text-sm text-gray-600">
        Los precios salen con el precio de hoy en la web (con el descuento, si hay); podés cambiarlos para esta venta.
        Al guardar queda el comprobante listo para mandar.
      </p>
      <div className="mt-6">
        <SaleForm products={products} defaultSoldAt={toLocalInputValue(new Date())} />
      </div>
    </div>
  );
}
