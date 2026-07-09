import PDFDocument from 'pdfkit';
import path from 'path';
import { db } from './db';
import { ticketQrBuffer } from './ticketQr';
import { ticketStatusLabel, ticketCount, ticketBreakdown, hasReducedTickets, type TicketDetail } from './ticketDetail';
import { REDUCED_TICKET_NOTICE } from './reducedTickets';

function fmtDateTime(d: Date): string {
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// pdfkit's built-in fonts (Helvetica & co) have NO Cyrillic glyphs — without a
// registered TTF every Russian string renders as mojibake. The site's woff2 fonts
// can't be loaded by pdfkit, so the PDF uses these dedicated TTF copies of Manrope
// (the site's body font — full file, Cyrillic + ₽ included).
const FONT_DIR = path.join(process.cwd(), 'public', 'fonts', 'pdf');

// Simple, imperative single-page ticket PDF (A5) — program, session time, seat
// count, price, order number, status and the same QR the customer sees in the
// личный кабинет. No React/browser dependency, works in a Node route handler.
export async function buildTicketPdf(t: TicketDetail, origin: string): Promise<Buffer> {
  const company = await db.companySettings.findUnique({ where: { id: 1 } });
  const qr = await ticketQrBuffer(t.id, origin);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A5', margin: 36 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.registerFont('body', path.join(FONT_DIR, 'Manrope-400.ttf'));
    doc.registerFont('bold', path.join(FONT_DIR, 'Manrope-700.ttf'));

    doc.font('bold').fontSize(16).text(company?.name || 'Музей русской сказки', { align: 'center' });
    doc.moveDown();
    doc.fontSize(20).text(t.event?.program.title || 'Билет', { align: 'center' });
    doc.moveDown();

    doc.font('body').fontSize(12);
    if (t.event) {
      doc.text(`Дата и время: ${fmtDateTime(t.event.startAt)} – ${fmtDateTime(t.event.endAt)}`);
    }
    doc.text(`Количество билетов: ${ticketCount(t)}`);
    if (t.children > 0 || hasReducedTickets(t)) doc.text(ticketBreakdown(t));
    doc.text(`Стоимость: ${t.amount ? `${t.amount} ₽` : 'по запросу'}${hasReducedTickets(t) && t.reducedDiscount ? ` (скидка ${t.reducedDiscount} ₽)` : ''}`);
    doc.text(`Номер заказа: №${t.number}`);
    doc.text(`Статус: ${ticketStatusLabel(t)}`);
    doc.moveDown();

    doc.image(qr, { fit: [160, 160], align: 'center' });
    doc.moveDown();
    doc.fontSize(9).fillColor('#666').text('Покажите этот билет (или QR-код) на входе.', { align: 'center' });
    if (hasReducedTickets(t)) {
      doc.moveDown(0.5);
      doc.fontSize(8).fillColor('#8B1A2F').text(REDUCED_TICKET_NOTICE, { align: 'center' });
    }

    doc.end();
  });
}
