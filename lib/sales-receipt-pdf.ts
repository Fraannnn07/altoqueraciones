import 'server-only';
import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { Sale } from '@/lib/admin-sales';
import { telefonoLegible } from '@/lib/fidelidad/config';
import { formatUyu } from '@/lib/format';
import { SALES_TIME_ZONE, formatSaleNumber, paymentLabel } from '@/lib/sales';
import { siteConfig } from '@/lib/site-config';

// Comprobante no fiscal de una venta, en A5: se lee bien en el celular (lo más común es mandarlo por
// WhatsApp) y se imprime bien en A4. Usa la Helvetica que trae el PDF, así que no hay que cargar fuentes.

const PAGE: [number, number] = [419.53, 595.28]; // A5 vertical, en puntos
const MARGIN = 32;
const FOOTER_SPACE = 74;

const forest = rgb(0x13 / 255, 0x4b / 255, 0x32 / 255);
const amber = rgb(0xe0 / 255, 0x9a / 255, 0x33 / 255);
const cream = rgb(0xf9 / 255, 0xf6 / 255, 0xee / 255);
const ink = rgb(0.13, 0.13, 0.13);
const muted = rgb(0.42, 0.42, 0.42);
const rule = rgb(0.87, 0.87, 0.87);
const red = rgb(0.75, 0.11, 0.11);

const SITE_HOST = 'altoqueraciones.com';

const receiptDateFormatter = new Intl.DateTimeFormat('es-UY', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: SALES_TIME_ZONE,
});

export async function buildSaleReceiptPdf(sale: Sale): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const number = formatSaleNumber(sale.number);

  pdf.setTitle(`Comprobante Nº ${number} - ${siteConfig.name}`);
  pdf.setAuthor(siteConfig.name);
  pdf.setCreator(siteConfig.name);
  pdf.setLanguage('es-UY');

  // La Helvetica del PDF solo dibuja Latin-1 (WinAnsi): lo demás (emojis, flechas) se cambia por "?".
  const supported = new Set(regular.getCharacterSet());
  const safe = (text: string) =>
    Array.from(text.replace(/[  ]/g, ' ').replace(/[\r\n\t]+/g, ' '))
      .map((char) => (supported.has(char.codePointAt(0)!) ? char : '?'))
      .join('');

  const width = PAGE[0];
  const contentWidth = width - MARGIN * 2;
  let page: PDFPage;
  let y: number;

  const text = (
    value: string,
    x: number,
    top: number,
    { font = regular, size = 10, color = ink, align = 'left' }: TextOptions = {},
  ) => {
    const clean = safe(value);
    const dx = align === 'right' ? font.widthOfTextAtSize(clean, size) : 0;
    page.drawText(clean, { x: x - dx, y: top - size, size, font, color });
  };

  const wrap = (value: string, font: PDFFont, size: number, maxWidth: number): string[] => {
    const lines: string[] = [];
    let current = '';
    for (const word of safe(value).split(' ').filter(Boolean)) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);
      // Una palabra más larga que la columna se corta a la fuerza.
      let rest = word;
      while (font.widthOfTextAtSize(rest, size) > maxWidth) {
        let cut = rest.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > maxWidth) cut--;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      current = rest;
    }
    if (current) lines.push(current);
    return lines.length > 0 ? lines : [''];
  };

  const drawFooter = () => {
    const top = MARGIN + 46;
    page.drawLine({ start: { x: MARGIN, y: top + 8 }, end: { x: width - MARGIN, y: top + 8 }, thickness: 0.5, color: rule });
    text('¡Gracias por tu compra!', MARGIN, top, { font: bold, size: 10, color: forest });
    const whatsapp = telefonoLegible(`0${siteConfig.whatsappNumber.replace(/^598/, '')}`);
    const instagram = siteConfig.sameAs[0]?.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '');
    text([`WhatsApp ${whatsapp}`, SITE_HOST, instagram].filter(Boolean).join('  ·  '), MARGIN, top - 16, {
      size: 8,
      color: muted,
    });
    text('Documento no válido como factura.', MARGIN, top - 30, { size: 8, color: muted });
  };

  const drawVoidStamp = () => {
    if (!sale.voided) return;
    const label = 'ANULADA';
    const size = 64;
    const labelWidth = bold.widthOfTextAtSize(label, size);
    page.drawText(label, {
      x: width / 2 - (labelWidth / 2) * Math.cos(Math.PI / 6),
      y: PAGE[1] / 2 - (labelWidth / 2) * Math.sin(Math.PI / 6),
      size,
      font: bold,
      color: red,
      opacity: 0.18,
      rotate: degrees(30),
    });
  };

  const newPage = (continuation: boolean) => {
    page = pdf.addPage(PAGE);
    drawVoidStamp();
    drawFooter();
    if (continuation) {
      y = PAGE[1] - MARGIN;
      text(`${siteConfig.name} · Comprobante Nº ${number} (continuación)`, MARGIN, y, { font: bold, size: 9, color: muted });
      y -= 24;
    }
  };

  // ---------------------------------------------------------------- encabezado
  newPage(false);
  const bandHeight = 76;
  page!.drawRectangle({ x: 0, y: PAGE[1] - bandHeight, width, height: bandHeight, color: forest });
  text(siteConfig.name, MARGIN, PAGE[1] - 22, { font: bold, size: 18, color: rgb(1, 1, 1) });
  text('Raciones para perros y gatos · Montevideo', MARGIN, PAGE[1] - 46, { size: 9, color: cream });
  text('COMPROBANTE DE VENTA', width - MARGIN, PAGE[1] - 22, { font: bold, size: 8, color: amber, align: 'right' });
  text(`Nº ${number}`, width - MARGIN, PAGE[1] - 36, { font: bold, size: 15, color: rgb(1, 1, 1), align: 'right' });
  y = PAGE[1] - bandHeight - 22;

  // ---------------------------------------------------------------- datos de la venta
  const field = (label: string, value: string, x: number, top: number, maxWidth: number) => {
    text(label.toUpperCase(), x, top, { font: bold, size: 7, color: muted });
    const lines = wrap(value, regular, 10, maxWidth).slice(0, 2);
    lines.forEach((line, index) => text(line, x, top - 11 - index * 13));
    return 11 + lines.length * 13;
  };
  const columnWidth = contentWidth / 2 - 8;
  const rightX = MARGIN + contentWidth / 2 + 8;
  let rowHeight = Math.max(
    field('Fecha', receiptDateFormatter.format(new Date(sale.sold_at)), MARGIN, y, columnWidth),
    field('Medio de pago', paymentLabel(sale.payment_method), rightX, y, columnWidth),
  );
  y -= rowHeight + 10;
  rowHeight = Math.max(
    field('Cliente', sale.customer_name || 'Consumidor final', MARGIN, y, columnWidth),
    sale.customer_phone ? field('Celular', telefonoLegible(sale.customer_phone), rightX, y, columnWidth) : 0,
  );
  y -= rowHeight + 18;

  // ---------------------------------------------------------------- productos
  const qtyRight = MARGIN + 26;
  const descX = MARGIN + 36;
  const amountRight = width - MARGIN - 6;
  const unitRight = amountRight - 76;
  const descWidth = unitRight - 70 - descX;

  const drawTableHeader = () => {
    page.drawRectangle({ x: MARGIN, y: y - 20, width: contentWidth, height: 20, color: cream });
    const top = y - 6;
    text('Cant.', qtyRight, top, { font: bold, size: 8, color: forest, align: 'right' });
    text('Descripción', descX, top, { font: bold, size: 8, color: forest });
    text('P. unit.', unitRight, top, { font: bold, size: 8, color: forest, align: 'right' });
    text('Importe', amountRight, top, { font: bold, size: 8, color: forest, align: 'right' });
    y -= 28;
  };
  drawTableHeader();

  for (const item of sale.items) {
    const lines = wrap(item.description, regular, 10, descWidth);
    const height = lines.length * 13 + 8;
    if (y - height < MARGIN + FOOTER_SPACE) {
      newPage(true);
      drawTableHeader();
    }
    text(String(item.quantity), qtyRight, y, { align: 'right' });
    lines.forEach((line, index) => text(line, descX, y - index * 13));
    text(formatUyu(item.unit_price_uyu), unitRight, y, { color: muted, align: 'right' });
    text(formatUyu(item.line_total_uyu), amountRight, y, { align: 'right' });
    y -= height;
    page!.drawLine({ start: { x: MARGIN, y: y + 4 }, end: { x: width - MARGIN, y: y + 4 }, thickness: 0.5, color: rule });
  }

  // ---------------------------------------------------------------- totales
  const totalsHeight = (sale.discount_uyu > 0 ? 36 : 18) + 30;
  if (y - totalsHeight < MARGIN + FOOTER_SPACE) newPage(true);
  y -= 8;
  const labelRight = unitRight;
  if (sale.discount_uyu > 0) {
    text('Subtotal', labelRight, y, { color: muted, align: 'right' });
    text(formatUyu(sale.subtotal_uyu), amountRight, y, { align: 'right' });
    y -= 16;
    text('Descuento', labelRight, y, { color: muted, align: 'right' });
    text(`- ${formatUyu(sale.discount_uyu)}`, amountRight, y, { align: 'right' });
    y -= 20;
  }
  text('TOTAL', labelRight, y - 2, { font: bold, size: 11, color: forest, align: 'right' });
  text(formatUyu(sale.total_uyu), amountRight, y, { font: bold, size: 15, color: forest, align: 'right' });
  y -= 34;

  // ---------------------------------------------------------------- nota
  if (sale.notes.trim()) {
    const lines = wrap(sale.notes, regular, 9, contentWidth);
    if (y - (lines.length * 12 + 14) < MARGIN + FOOTER_SPACE) newPage(true);
    text('NOTA', MARGIN, y, { font: bold, size: 7, color: muted });
    y -= 11;
    for (const line of lines) {
      text(line, MARGIN, y, { size: 9 });
      y -= 12;
    }
  }

  return pdf.save();
}

interface TextOptions {
  font?: PDFFont;
  size?: number;
  color?: ReturnType<typeof rgb>;
  align?: 'left' | 'right';
}
