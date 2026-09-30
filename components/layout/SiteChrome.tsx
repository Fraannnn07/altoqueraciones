'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Envuelve el contenido con el header/footer de la tienda, salvo dentro de /admin
 * (que tiene su propia barra). Los slots llegan ya renderizados desde el servidor.
 * `homeAnnouncement` (la barra del descuento general) va arriba del header, solo en el inicio.
 */
export function SiteChrome({
  header,
  footer,
  extras,
  homeAnnouncement,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  extras: ReactNode;
  homeAnnouncement: ReactNode;
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
      {pathname === '/' ? homeAnnouncement : null}
      {header}
      <main className="flex-1">{children}</main>
      {footer}
    </>
  );
}
