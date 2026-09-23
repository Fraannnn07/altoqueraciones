'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  // El menú queda abierto solo para la ruta donde se abrió: al navegar se cierra solo.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname;

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        onClick={() => setOpenFor(open ? null : pathname)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-gray-700"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          {open ? (
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {open ? (
        <nav
          id="mobile-menu"
          aria-label="Menú principal"
          className="absolute left-0 right-0 top-full border-b border-black/5 bg-white shadow-md"
        >
          <ul className="mx-auto max-w-6xl px-4 py-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="block py-3 text-base font-semibold text-gray-800">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
