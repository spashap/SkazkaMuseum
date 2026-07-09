import { db } from './db';
import { sendEmail } from './integrations/mail';
import { REDUCED_TICKET_NOTICE } from './reducedTickets';
import { ticketBreakdown, hasReducedTickets, getTicketDetail } from './ticketDetail';
import { buildTicketPdf } from './ticketPdf';
import { ticketUrl } from './ticketQr';
import type { Booking, Event, Program } from '@prisma/client';

// Ticket email — sent best-effort right after a Booking is created
// (see src/app/api/tickets/order/route.ts): the PDF ticket (with QR) is attached
// and the bearer link to the ticket page is in the body. No-ops silently if
// UNISENDER_GO_API_KEY isn't set (same convention as every other integration) or
// if there's no address to send to (guest checkout has no email field to require,
// so this is opportunistic).
export async function sendOrderConfirmationEmail(opts: {
  to: string;
  toName: string;
  program: Program;
  event: Event;
  booking: Booking;
  origin?: string;
}): Promise<void> {
  const { to, toName, program, event, booking } = opts;
  const origin = opts.origin || process.env.NEXT_PUBLIC_SITE_URL || 'https://skazkamuseum.ru';
  const isReduced = hasReducedTickets(booking);
  try {
    const company = await db.companySettings.findUnique({ where: { id: 1 } });

    const dateStr = event.startAt.toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow',
    });

    // The attachment is best-effort on top of best-effort: a PDF hiccup must not
    // downgrade to NO email at all — the text confirmation still goes out.
    let attachment;
    try {
      const detail = await getTicketDetail(booking.id);
      if (detail) {
        attachment = {
          filename: `ticket-${booking.number}.pdf`,
          contentType: 'application/pdf',
          content: await buildTicketPdf(detail, origin),
        };
      }
    } catch (e) {
      console.error('[orderEmail] ticket PDF failed — sending without attachment', e);
    }

    const html = `
      <p>Спасибо за заказ! Ваш заказ №${booking.number} оформлен.</p>
      <p><strong>${program.title}</strong><br>${dateStr}</p>
      <p>${ticketBreakdown(booking)}<br>Сумма: ${booking.amount} ₽${isReduced ? ` (скидка ${booking.reducedDiscount} ₽)` : ''}</p>
      ${isReduced ? `<p style="color:#8B1A2F">⚠ ${REDUCED_TICKET_NOTICE}</p>` : ''}
      ${attachment ? '<p>Билет с QR-кодом — во вложении. Покажите его на входе с экрана или распечатайте.</p>' : ''}
      <p>Билет также доступен по ссылке: <a href="${ticketUrl(booking.id, origin)}">${ticketUrl(booking.id, origin)}</a></p>
    `;

    await sendEmail({
      to, toName,
      fromName: company?.name || 'Музей русской сказки',
      replyTo: company?.email || undefined,
      subject: `Заказ №${booking.number} оформлен — ${program.title}`,
      html,
      attachment,
    });
  } catch (e) {
    console.error('[orderEmail] failed to send confirmation', e);
  }
}

// Payment-received email — sent by verifyAndApplyPayment (src/lib/payments.ts)
// once YooKassa confirms the money, with the ticket PDF re-generated so its
// status line already reads «Оплачена». The fiscal receipt (чек) is NOT ours to
// send — YooKassa emails it to the buyer itself.
export async function sendPaymentReceivedEmail(opts: {
  to: string;
  toName: string;
  program: Program;
  event: Event;
  booking: Booking;
  origin?: string;
}): Promise<void> {
  const { to, toName, program, event, booking } = opts;
  const origin = opts.origin || process.env.NEXT_PUBLIC_SITE_URL || 'https://skazkamuseum.ru';
  try {
    const company = await db.companySettings.findUnique({ where: { id: 1 } });

    const dateStr = event.startAt.toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow',
    });

    let attachment;
    try {
      const detail = await getTicketDetail(booking.id);
      if (detail) {
        attachment = {
          filename: `ticket-${booking.number}.pdf`,
          contentType: 'application/pdf',
          content: await buildTicketPdf(detail, origin),
        };
      }
    } catch (e) {
      console.error('[orderEmail] paid-ticket PDF failed — sending without attachment', e);
    }

    await sendEmail({
      to, toName,
      fromName: company?.name || 'Музей русской сказки',
      replyTo: company?.email || undefined,
      subject: `Оплата получена — заказ №${booking.number}, ${program.title}`,
      html: `
        <p>Оплата получена, ждём вас в музее!</p>
        <p><strong>${program.title}</strong><br>${dateStr}</p>
        <p>${ticketBreakdown(booking)}<br>Оплачено: ${booking.amount} ₽</p>
        ${attachment ? '<p>Билет с QR-кодом — во вложении. Покажите его на входе с экрана или распечатайте.</p>' : ''}
        <p>Билет также доступен по ссылке: <a href="${ticketUrl(booking.id, origin)}">${ticketUrl(booking.id, origin)}</a></p>
        <p>Кассовый чек придёт отдельным письмом от ЮKassa.</p>
      `,
      attachment,
    });
  } catch (e) {
    console.error('[orderEmail] failed to send payment-received email', e);
  }
}
