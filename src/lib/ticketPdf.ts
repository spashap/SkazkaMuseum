import PDFDocument from 'pdfkit';
import { db } from './db';
import { ticketQrBuffer } from './ticketQr';
import { ticketStatusLabel, type TicketDetail } from './ticketDetail';

function fmtDateTime(d: Date): string {
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

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

    doc.fontSize(16).text(company?.name || 'Музей русской сказки', { align: 'center' });
    doc.moveDown();
    doc.fontSize(20).text(t.event?.program.title || 'Билет', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12);
    if (t.event) {
      doc.text(`Дата и время: ${fmtDateTime(t.event.startAt)} – ${fmtDateTime(t.event.endAt)}`);
    }
    doc.text(`Количество билетов: ${t.adults + t.children}`);
    doc.text(`Стоимость: ${t.amount ? `${t.amount} ₽` : 'по запросу'}`);
    doc.text(`Номер заказа: №${t.number}`);
    doc.text(`Статус: ${ticketStatusLabel(t)}`);
    doc.moveDown();

    doc.image(qr, { fit: [160, 160], align: 'center' });
    doc.moveDown();
    doc.fontSize(9).fillColor('#666').text('Покажите этот билет (или QR-код) на входе.', { align: 'center' });

    doc.end();
  });
}
