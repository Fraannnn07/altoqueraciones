import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getActiveBrandsWithProducts } from '@/lib/data/brands';
import { storageUrl } from '@/lib/storage';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: `Marcas de Alimento para Mascotas en Uruguay | ${siteConfig.name}`,
    description:
      'Todas las marcas de raciones y accesorios para perros y gatos disponibles en Uruguay: Equilibrio, BioFresh, Pro Plan, NexGard y más.',
    path: '/marcas/',
  });
}

export default async function BrandsIndexPage() {
  const brands = await getActiveBrandsWithProducts();

  return (
    <div className="pb-16">
      <Breadcrumbs items={[{ name: 'Inicio', url: '/' }, { name: 'Marcas', url: '/marcas/' }]} />

      <div className="mx-auto max-w-6xl px-4 pt-6">
        <h1 className="font-display text-3xl font-bold text-gray-900">Marcas</h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Trabajamos con las principales marcas de alimento y cuidado para mascotas en Uruguay.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {brands.map((brand) => {
            const logo = storageUrl(brand.logo_path);
            return (
              <Link
                key={brand.id}
                href={`/marcas/${brand.slug}/`}
                className="flex flex-col items-center gap-3 rounded-2xl border border-black/5 bg-white p-6 text-center shadow-sm transition hover:shadow-md"
              >
                {logo ? (
                  <Image src={logo} alt={brand.name} width={96} height={96} className="h-16 w-16 object-contain" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-warm-gray font-display text-lg font-bold text-brand-green-dark">
                    {brand.name.charAt(0)}
                  </div>
                )}
                <span className="font-semibold text-gray-800">{brand.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
