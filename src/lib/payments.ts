import { db } from './db';
import { getPayment } from './integrations/yookassa';
import { notifyTelegram } from './integrations/telegram';
import { sendPaymentReceivedEmail } from './orderEmail';

// Shared by the YooKassa webhook and the checkout status-poll endpoint so a
// payment gets applied to its bookings exactly the same way no matter which of
// the two learns about it first. Always verifies against the YooKassa API —
// webhook bodies are unauthenticated and are never trusted.
//
// Returns the payment status ('succeeded' | 'canceled' | 'pending' | ...) or
// null when the payment can't be verified.
export async function verifyAndApplyPayment(paymentId: string, origin?: string): Promise<string | null> {
  const payment = await getPayment(paymentId);
  if (!payment) return null;

  if (payment.status !== 'succeeded' && payment.status !== 'canceled') {
    return payment.status; // non-final — nothing to apply
  }

  const bookings = await db.booking.findMany({
    where: { paymentId },
    include: { event: { include: { program: true } }, client: true },
  });
  if (bookings.length === 0) {
    console.warn(`[payments] payment ${paymentId} (${payment.status}) matches no bookings`);
    return payment.status;
  }

  if (payment.status === 'succeeded') {
    const expected = bookings.reduce((s, b) => s + b.amount, 0);
    if (payment.amountRub !== expected) {
      // Applied anyway (money WAS received) but flagged loudly for the admin.
      console.warn(`[payments] AMOUNT MISMATCH for ${paymentId}: paid ${payment.amountRub}₽, bookings total ${expected}₽`);
    }

    for (const b of bookings) {
      if (b.status === 'paid') continue; // idempotent: webhook retries / poll+webhook race
      const history = JSON.parse(b.historyJson || '[]');
      history.push({ at: new Date().toISOString(), event: 'paid_online', paymentId });
      await db.booking.update({
        where: { id: b.id },
        data: { status: 'paid', payMethod: 'online', historyJson: JSON.stringify(history) },
      });
      // The Transaction row is what admin «Финансы»/«Выручка» aggregate — created
      // ONLY here, for verified money. Abandoned payment attempts never reach this.
      await db.transaction.create({
        data: { bookingId: b.id, amount: b.amount, method: 'online', status: 'completed' },
      });

      const emailTo = b.client?.email;
      if (emailTo && b.event) {
        sendPaymentReceivedEmail({
          to: emailTo,
          toName: b.client?.fullName || '',
          booking: b,
          event: b.event,
          program: b.event.program,
          origin,
        }).catch(() => {});
      }
      notifyTelegram(
        `💳 <b>Оплачен заказ №${b.number}</b>\n${b.event?.program.title || ''}\nСумма: ${b.amount} ₽`
      ).catch(() => {});
    }
  }

  if (payment.status === 'canceled') {
    for (const b of bookings) {
      if (b.status === 'paid') continue; // never downgrade a paid booking
      const history = JSON.parse(b.historyJson || '[]');
      if (history.some((h: { event?: string; paymentId?: string }) => h.event === 'payment_canceled' && h.paymentId === paymentId)) continue;
      history.push({ at: new Date().toISOString(), event: 'payment_canceled', paymentId });
      // Booking itself stays 'new' — the buyer may retry online or pay at the
      // till; seat release / cancellation is the admin's call, not automatic.
      await db.booking.update({ where: { id: b.id }, data: { historyJson: JSON.stringify(history) } });
    }
  }

  return payment.status;
}
