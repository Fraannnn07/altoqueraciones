import Link from 'next/link';
import { logoutAction } from '@/app/admin/actions';

const links = [
  { href: '/admin/', label: 'Panel' },
  { href: '/admin/productos/', label: 'Productos' },
  { href: '/admin/marcas/', label: 'Marcas' },
];

export function AdminNav() {
  return (
    <header className="border-b border-black/5 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold text-gray-700">
          <span className="font-display text-base font-bold text-brand-green-dark">Admin</span>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-brand-green-dark">
              {link.label}
            </Link>
          ))}
          <a href="/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand-green-dark">
            Ver sitio ↗
          </a>
        </nav>
        <form action={logoutAction}>
          <button type="submit" className="text-sm font-semibold text-gray-500 hover:text-red-700">
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}
