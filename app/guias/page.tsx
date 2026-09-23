import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getPublishedGuides } from '@/lib/data/guides';
import { storageUrl } from '@/lib/storage';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: `Guías para Dueños de Mascotas en Uruguay | ${siteConfig.name}`,
    description:
      'Consejos y guías prácticas sobre alimentación, salud y cuidado de perros y gatos en Uruguay.',
    path: '/guias/',
  });
}

export default async function GuidesIndexPage() {
  const guides = await getPublishedGuides();

  return (
    <div className="pb-16">
      <Breadcrumbs items={[{ name: 'Inicio', url: '/' }, { name: 'Guías', url: '/guias/' }]} />

      <div className="mx-auto max-w-6xl px-4 pt-6">
        <h1 className="font-display text-3xl font-bold text-gray-900">Guías</h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Consejos prácticos sobre alimentación, salud y cuidado de tu mascota.
        </p>

        {guides.length === 0 ? (
          <p className="mt-8 text-gray-500">Todavía no hay guías publicadas.</p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide) => {
              const cover = storageUrl(guide.cover_image_path);
              return (
                <Link
                  key={guide.id}
                  href={`/guias/${guide.slug}/`}
                  className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:shadow-md"
                >
                  {cover ? (
                    <div className="relative aspect-video bg-brand-warm-gray">
                      <Image src={cover} alt={guide.title} fill className="object-cover" />
                    </div>
                  ) : null}
                  <div className="p-5">
                    <h2 className="font-display text-lg font-semibold text-gray-900">{guide.title}</h2>
                    {guide.excerpt ? <p className="mt-2 text-sm text-gray-600">{guide.excerpt}</p> : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
