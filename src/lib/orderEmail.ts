import { db } from './db';
import { sendEmail } from './integrations/mail';
import { REDUCED_TICKET_NOTICE } from './reducedTickets';
import { ticketBreakdown, hasReducedTickets, getTicketDetail } from './ticketDetail';
import { buildTicketPdf } from './ticketPdf';
import { ticketUrl } from './ticketQr';
import type { Booking, Event, Program } from '@prisma/client';

// Order-confirmation email — sent right after a Booking is created, BEFORE any
// payment. Deliberately carries NO ticket: no PDF, no bearer link. The ticket
// (PDF + QR) is delivered only by sendPaymentReceivedEmail below, once YooKassa
// confirms the money — a buyer whose payment was canceled must not hold
// anything that looks like a valid ticket. The order number is enough for the
// pay-at-the-till fallback (cashier looks it up by number).
export async function sendOrderConfirmationEmail(opts: {
  to: string;
  toName: string;
  program: Program;
  event: Event;
  booking: Booking;
  origin?: string;
}): Promise<void> {
  const { to, toName, program, event, booking } = opts;
  const isReduced = hasReducedTickets(booking);
  try {
    const company = await db.companySettings.findUnique({ where: { id: 1 } });

    const dateStr = event.startAt.toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow',
    });

    const html = `
      <p>Спасибо за заказ! Ваш заказ №${booking.number} оформлен.</p>
      <p><strong>${program.title}</strong><br>${dateStr}</p>
      <p>${ticketBreakdown(booking)}<br>Сумма: ${booking.amount} ₽${isReduced ? ` (скидка ${booking.reducedDiscount} ₽)` : ''}</p>
      ${isReduced ? `<p style="color:#8B1A2F">⚠ ${REDUCED_TICKET_NOTICE}</p>` : ''}
      <p><strong>Билет придёт отдельным письмом сразу после оплаты.</strong></p>
      <p>Если вы не оплатили заказ онлайн — оплатите его на кассе при визите, назвав номер заказа №${booking.number}.</p>
    `;

    await sendEmail({
      to, toName,
      fromName: company?.name || 'Музей русской сказки',
      replyTo: company?.email || undefined,
      subject: `Заказ №${booking.number} оформлен — ${program.title}`,
      html,
    });
  } catch (e) {
    console.error('[orderEmail] failed to send confirmation', e);
  }
}

// Payment-received email — the ticket delivery. Reached only through
// sendTicketEmailForBooking below, with the ticket PDF re-generated so its
// status line already reads «Оплачена». The fiscal receipt (чек) is NOT ours to
// send — YooKassa emails it to the buyer itself. Returns whether SMTP accepted
// the message so the caller can persist the delivery status.
async function sendPaymentReceivedEmail(opts: {
  to: string;
  toName: string;
  program: Program;
  event: Event;
  booking: Booking;
  origin?: string;
}): Promise<boolean> {
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

    return await sendEmail({
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
    return false;
  }
}

// The ONE way to (re)send the paid ticket for a booking — used by the YooKassa
// webhook/poll path, cash payment at the till, and the admin resend button.
// Looks the booking up fresh (so the PDF reflects the paid status), picks the
// address (per-order buyerEmail wins over the client card) and persists the
// delivery outcome on the booking, which is what the admin «Проблемы с email»
// filter reads.
export async function sendTicketEmailForBooking(
  bookingId: string,
  origin?: string
): Promise<'sent' | 'failed' | 'no_email' | 'skipped'> {
  const detail = await getTicketDetail(bookingId);
  if (!detail || !detail.event) return 'skipped'; // no session → no ticket to send

  const emailTo = detail.buyerEmail || detail.client?.email;
  if (!emailTo) {
    await db.booking.update({
      where: { id: bookingId },
      data: { ticketEmailStatus: 'no_email', ticketEmailAt: new Date() },
    });
    return 'no_email';
  }

  const ok = await sendPaymentReceivedEmail({
    to: emailTo,
    toName: detail.client?.fullName || '',
    booking: detail,
    event: detail.event,
    program: detail.event.program,
    origin,
  });
  const status = ok ? 'sent' : 'failed';
  await db.booking.update({
    where: { id: bookingId },
    data: { ticketEmailStatus: status, ticketEmailAt: new Date() },
  });
  return status;
}
