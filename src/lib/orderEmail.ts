import { db } from './db';
import { sendEmail } from './integrations/unisender';
import { REDUCED_TICKET_NOTICE } from './reducedTickets';
import { ticketBreakdown } from './ticketDetail';
import type { Booking, Event, Program } from '@prisma/client';

// Order-confirmation email — sent best-effort right after a Booking is created
// (see src/app/api/tickets/order/route.ts). No-ops silently if UNISENDER_GO_API_KEY
// isn't set (same convention as every other integration) or if there's no address to
// send to (guest checkout has no email field to require, so this is opportunistic).
export async function sendOrderConfirmationEmail(opts: {
  to: string;
  toName: string;
  program: Program;
  event: Event;
  booking: Booking;
}): Promise<void> {
  const { to, toName, program, event, booking } = opts;
  const isReduced = booking.reduced > 0;
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
      <p>Билет и QR-код доступны в личном кабинете на сайте.</p>
    `;

    await sendEmail({
      to, toName,
      fromEmail: company?.email || 'noreply@skazkamuseum.ru',
      fromName: company?.name || 'Музей русской сказки',
      subject: `Заказ №${booking.number} оформлен — ${program.title}`,
      html,
    });
  } catch (e) {
    console.error('[orderEmail] failed to send confirmation', e);
  }
}
