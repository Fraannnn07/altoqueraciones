import { getActiveProductsForFeed } from '@/lib/data/products';
import { storageUrl } from '@/lib/storage';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 3600;

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripMarkdown(value: string): string {
  return value.replace(/[#*_`>\-]/g, '').trim();
}

export async function GET() {
  const products = await getActiveProductsForFeed();

  const items = products
    .map((product) => {
      const title = `${product.brand.name} ${product.name} ${product.presentation}`.trim();
      const description = stripMarkdown(product.short_description || product.long_description || title);
      const imageUrl = storageUrl(product.primaryImage?.storage_path);
      if (!imageUrl) return '';

      return `
    <item>
      <g:id>${xmlEscape(product.slug)}</g:id>
      <title>${xmlEscape(title)}</title>
      <description>${xmlEscape(description)}</description>
      <link>${siteConfig.url}/producto/${product.slug}/</link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:availability>${product.stock_status === 'in_stock' ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${product.price_uyu} UYU</g:price>
      <g:brand>${xmlEscape(product.brand.name)}</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xmlEscape(siteConfig.name)} — Catálogo</title>
    <link>${siteConfig.url}</link>
    <description>Raciones y accesorios para mascotas en Uruguay</description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
