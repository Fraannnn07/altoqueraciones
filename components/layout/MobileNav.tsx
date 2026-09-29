'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { SearchForm, SearchIcon } from '@/components/search/SearchForm';

type Panel = 'menu' | 'search';

const toggleClassName =
  'flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-gray-700';

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Botones de búsqueda (hasta lg; más ancho el header ya muestra el campo) y de menú (hasta md), con sus
 * paneles debajo del header. Van en el mismo componente para que nunca queden los dos abiertos a la vez.
 */
export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  // Un panel queda abierto solo para la ruta donde se abrió: al navegar se cierra solo.
  const [openState, setOpenState] = useState<{ panel: Panel; path: string } | null>(null);
  const open = openState?.path === pathname ? openState.panel : null;
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  const toggle = (panel: Panel) => setOpenState(open === panel ? null : { panel, path: pathname });

  return (
    <div className="flex items-center gap-2 lg:hidden">
      <button
        ref={searchButtonRef}
        type="button"
        aria-expanded={open === 'search'}
        aria-controls="mobile-search"
        aria-label={open === 'search' ? 'Cerrar búsqueda' : 'Buscar productos'}
        onClick={() => toggle('search')}
        className={toggleClassName}
      >
        {open === 'search' ? <CloseIcon /> : <SearchIcon />}
      </button>

      <button
        type="button"
        aria-expanded={open === 'menu'}
        aria-controls="mobile-menu"
        aria-label={open === 'menu' ? 'Cerrar menú' : 'Abrir menú'}
        onClick={() => toggle('menu')}
        className={`${toggleClassName} md:hidden`}
      >
        {open === 'menu' ? (
          <CloseIcon />
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open === 'search' ? (
        <div
          id="mobile-search"
          className="absolute left-0 right-0 top-full border-b border-black/5 bg-white shadow-md"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpenState(null);
              searchButtonRef.current?.focus();
            }
          }}
        >
          <div className="mx-auto max-w-6xl px-4 py-3">
            {/* Cerrar al buscar: si ya se está en /buscar/, la ruta no cambia y el panel quedaría abierto. */}
            <SearchForm autoFocus onSubmit={() => setOpenState(null)} />
          </div>
        </div>
      ) : null}

      {open === 'menu' ? (
        <nav
          id="mobile-menu"
          aria-label="Menú principal"
          className="absolute left-0 right-0 top-full border-b border-black/5 bg-white shadow-md md:hidden"
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
