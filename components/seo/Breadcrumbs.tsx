import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd, type BreadcrumbItem } from '@/lib/seo/jsonld';

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <>
      <JsonLd data={buildBreadcrumbJsonLd(items)} />
      <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-4 pt-4 text-xs text-gray-500">
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((item, index) => (
            <li key={item.url} className="flex items-center gap-1">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {index === items.length - 1 ? (
                <span className="font-semibold text-gray-700">{item.name}</span>
              ) : (
                <Link href={item.url} className="hover:text-brand-green-dark">
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
