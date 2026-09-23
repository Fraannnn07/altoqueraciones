import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { getDashboardCounts } from '@/lib/admin-data';
import { cardClass, primaryButtonClass, secondaryButtonClass } from '@/components/admin/ui';

export default async function AdminDashboardPage() {
  await requireAdmin();
  const counts = await getDashboardCounts();

  const stats = [
    { label: 'Productos activos', value: `${counts.activeProducts} / ${counts.products}` },
    { label: 'Marcas', value: counts.brands },
    { label: 'Guías publicadas', value: counts.guides },
    { label: 'Activos sin foto', value: counts.missingImages },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-gray-900">Panel</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className={cardClass}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{stat.label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {counts.missingImages > 0 ? (
        <p className="mt-6 rounded-xl bg-brand-orange-light p-4 text-sm text-gray-800">
          Hay {counts.missingImages} producto{counts.missingImages === 1 ? '' : 's'} activo
          {counts.missingImages === 1 ? '' : 's'} sin foto. En el sitio se ven con “Sin imagen” hasta que
          cargues una desde la ficha del producto.
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/productos/nuevo/" className={primaryButtonClass}>
          Agregar producto
        </Link>
        <Link href="/admin/productos/" className={secondaryButtonClass}>
          Ver productos
        </Link>
        <Link href="/admin/marcas/" className={secondaryButtonClass}>
          Marcas
        </Link>
      </div>
    </div>
  );
}
