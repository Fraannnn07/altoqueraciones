import Link from 'next/link';
import { getActiveRootCategories } from '@/lib/data/categories';
import { safe } from '@/lib/data/safe';
import { buildGeneralWhatsAppUrl } from '@/lib/whatsapp';
import { MobileNav } from '@/components/layout/MobileNav';
import { SearchForm } from '@/components/search/SearchForm';

// Nombres cortos para la barra de escritorio, donde no entran los nombres completos de todas las
// categorías; el menú desplegable y los títulos de las páginas siguen usando el nombre completo.
const SHORT_LABELS: Record<string, string> = {
  'raciones-perros': 'Perros',
  'raciones-gatos': 'Gatos',
  antipulgas: 'Antipulgas',
  'arena-gatos': 'Arena',
  'accesorios-perros': 'Accesorios',
};

export async function Header() {
  const categories = await safe(() => getActiveRootCategories(), []);
  const whatsappUrl = buildGeneralWhatsAppUrl();

  const links = [
    ...categories.map((category) => ({ href: `/${category.slug}/`, label: category.name })),
    { href: '/marcas/', label: 'Marcas' },
    { href: '/guias/', label: 'Guías' },
    { href: '/envios/', label: 'Envíos y retiros' },
    { href: '/preguntas-frecuentes/', label: 'Preguntas frecuentes' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-brand-warm-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="py-1 font-display text-xl font-bold text-brand-green-dark">
          Al Toque Raciones
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-semibold text-gray-700 lg:flex">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${category.slug}/`}
              title={category.name}
              className="transition hover:text-brand-green-dark"
            >
              {SHORT_LABELS[category.slug] ?? category.name}
            </Link>
          ))}
          <Link href="/marcas/" className="transition hover:text-brand-green-dark">
            Marcas
          </Link>
          <Link href="/guias/" className="transition hover:text-brand-green-dark">
            Guías
          </Link>
          <Link href="/envios/" className="transition hover:text-brand-green-dark">
            Envíos
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <SearchForm size="compact" placeholder="Buscar productos" className="hidden w-44 xl:block" />
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-brand-green px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-green-dark"
          >
            Escribinos
          </a>
          <MobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
