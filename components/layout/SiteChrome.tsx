'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Envuelve el contenido con el header/footer de la tienda, salvo dentro de /admin
 * (que tiene su propia barra). Los slots llegan ya renderizados desde el servidor.
 */
export function SiteChrome({
  header,
  footer,
  extras,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  extras: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');

  if (isAdmin) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      {extras}
      {header}
      <main className="flex-1">{children}</main>
      {footer}
    </>
  );
}
