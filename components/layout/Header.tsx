import Link from 'next/link';
import { getActiveRootCategories } from '@/lib/data/categories';
import { safe } from '@/lib/data/safe';
import { buildGeneralWhatsAppUrl } from '@/lib/whatsapp';
import { MobileNav } from '@/components/layout/MobileNav';

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

        <nav className="hidden items-center gap-6 text-sm font-semibold text-gray-700 md:flex">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${category.slug}/`}
              className="transition hover:text-brand-green-dark"
            >
              {category.name}
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
