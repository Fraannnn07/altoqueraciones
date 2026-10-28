import { isAdmin } from '@/lib/admin-auth';
import { getSale } from '@/lib/admin-sales';
import { receiptFileName } from '@/lib/sales';
import { buildSaleReceiptPdf } from '@/lib/sales-receipt-pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// PDF del comprobante. Con ?ver=1 se abre en el navegador en lugar de descargarse.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // proxy.ts ya protege /admin; esto es por si la ruta queda afuera del matcher algún día.
  if (!(await isAdmin())) return new Response('No autorizado', { status: 401 });

  const sale = await getSale(Number((await params).id));
  if (!sale) return new Response('No encontramos esa venta', { status: 404 });

  const pdf = await buildSaleReceiptPdf(sale);
  const inline = new URL(request.url).searchParams.has('ver');
  return new Response(new Uint8Array(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `${inline ? 'inline' : 'attachment'}; filename="${receiptFileName(sale)}"`,
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}
