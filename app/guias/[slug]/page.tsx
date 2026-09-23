import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { getAllPublishedGuideSlugs, getGuideBySlug, getGuideRelatedProducts } from '@/lib/data/guides';
import { safe } from '@/lib/data/safe';
import { storageUrl } from '@/lib/storage';
import { ProductCard } from '@/components/commerce/ProductCard';
import { WhatsAppCtaButton } from '@/components/commerce/WhatsAppCtaButton';
import { PriceComparisonTable } from '@/components/guides/PriceComparisonTable';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildArticleJsonLd } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site-config';
import { buildGeneralWhatsAppUrl } from '@/lib/whatsapp';

/** Única guía que necesita la tabla de precio/kg en vivo, para no quedar desactualizada. */
const PRICE_COMPARISON_GUIDE_SLUG = 'como-comparar-el-precio-por-kilo-de-las-raciones';

const dateFormatter = new Intl.DateTimeFormat('es-UY', { day: 'numeric', month: 'long', year: 'numeric' });

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await safe(() => getAllPublishedGuideSlugs(), []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);
  if (!guide) return {};
  const cover = storageUrl(guide.cover_image_path);
  return buildMetadata({
    title: `${guide.meta_title || guide.title} | ${siteConfig.name}`,
    description: guide.meta_description || guide.excerpt,
    path: `/guias/${guide.slug}/`,
    image: cover ?? undefined,
    type: 'article',
  });
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);
  if (!guide) notFound();

  const relatedProducts = await getGuideRelatedProducts(guide.id);
  const cover = storageUrl(guide.cover_image_path);
  const whatsappUrl = buildGeneralWhatsAppUrl(`Hola, tengo una consulta sobre "${guide.title}".`);

  return (
    <article className="pb-16">
      <Breadcrumbs
        items={[
          { name: 'Inicio', url: '/' },
          { name: 'Guías', url: '/guias/' },
          { name: guide.title, url: `/guias/${guide.slug}/` },
        ]}
      />
      <JsonLd
        data={buildArticleJsonLd({
          title: guide.title,
          slug: guide.slug,
          excerpt: guide.excerpt,
          coverImage: cover,
          publishedAt: guide.published_at,
        })}
      />

      <div className="mx-auto max-w-3xl px-4 pt-6">
        <h1 className="font-display text-3xl font-bold text-gray-900">{guide.title}</h1>
        <p className="mt-2 text-sm text-gray-500">
          Por Equipo Al Toque Raciones
          {guide.published_at ? ` · Publicado el ${dateFormatter.format(new Date(guide.published_at))}` : ''}
        </p>
        {cover ? (
          <div className="relative mt-6 aspect-video overflow-hidden rounded-2xl bg-brand-warm-gray">
            <Image src={cover} alt={guide.title} fill className="object-cover" priority />
          </div>
        ) : null}

        <div className="prose prose-neutral mt-8 max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
            {guide.body_markdown}
          </ReactMarkdown>
          {guide.slug === PRICE_COMPARISON_GUIDE_SLUG ? <PriceComparisonTable /> : null}
        </div>

        <div className="mt-10 rounded-xl bg-brand-warm-gray p-5">
          <p className="text-sm text-gray-700">¿Tenés dudas sobre algún alimento del catálogo?</p>
          <div className="mt-3">
            <WhatsAppCtaButton href={whatsappUrl} />
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 ? (
        <div className="mx-auto mt-12 max-w-6xl px-4">
          <h2 className="font-display text-xl font-bold text-gray-900">Productos relacionados</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
