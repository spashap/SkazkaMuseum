'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import { notifyTelegram } from '@/lib/integrations/telegram';
import { ticketBreakdown } from '@/lib/ticketDetail';
import { sendTicketEmailForBooking } from '@/lib/orderEmail';
import { requestOrigin } from '@/lib/origin';

// Entry-control actions (see projectSpec/checkin-plan.md). All three require a
// staff session with 'checkin' access — the public bearer ticket page renders
// the buttons only for staff, but the check here is what actually enforces it.

async function requireCheckinAccess() {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'checkin')) throw new Error('FORBIDDEN');
  return session;
}

function pushHistory(historyJson: string, event: Record<string, string>): string {
  const history = JSON.parse(historyJson || '[]');
  history.push({ at: new Date().toISOString(), ...event });
  return JSON.stringify(history);
}

function revalidateTicket(bookingId: string) {
  revalidatePath('/admin/checkin');
  revalidatePath(`/account/ticket/${bookingId}`);
}

// «Пропустить» — mark the whole group as let in. Idempotent: a second submit
// (double tap / two staff phones) keeps the FIRST mark.
export async function checkInBooking(formData: FormData) {
  const session = await requireCheckinAccess();
  const id = String(formData.get('id') || '');
  const b = await db.booking.findUnique({ where: { id }, include: { event: { include: { program: true } } } });
  if (!b || b.usedAt || b.status === 'cancelled') return;

  await db.booking.update({
    where: { id },
    data: {
      usedAt: new Date(),
      usedBy: session.name,
      historyJson: pushHistory(b.historyJson, { event: 'checked_in', by: session.name }),
    },
  });
  notifyTelegram(
    `🎟 <b>Вход: заказ №${b.number}</b>\n${b.event?.program.title || ''}\n${ticketBreakdown(b)}\nПропустил(а): ${session.name}`
  ).catch(() => {});
  revalidateTicket(id);
}

// «Вернуть» — undo a mistaken check-in.
export async function undoCheckIn(formData: FormData) {
  const session = await requireCheckinAccess();
  const id = String(formData.get('id') || '');
  const b = await db.booking.findUnique({ where: { id } });
  if (!b || !b.usedAt) return;

  await db.booking.update({
    where: { id },
    data: {
      usedAt: null,
      usedBy: '',
      historyJson: pushHistory(b.historyJson, { event: 'checkin_undone', by: session.name }),
    },
  });
  revalidateTicket(id);
}

// «Принять оплату на кассе» — the cash counterpart of the YooKassa webhook:
// same status change, same Transaction bookkeeping (method 'cash'), so Финансы
// show online and till revenue side by side.
export async function acceptCashPayment(formData: FormData) {
  const session = await requireCheckinAccess();
  const id = String(formData.get('id') || '');
  const b = await db.booking.findUnique({ where: { id } });
  if (!b || b.status === 'paid' || b.status === 'cancelled') return;

  await db.booking.update({
    where: { id },
    data: {
      status: 'paid',
      payMethod: 'cash',
      historyJson: pushHistory(b.historyJson, { event: 'paid_cash', by: session.name }),
    },
  });
  await db.transaction.create({ data: { bookingId: id, amount: b.amount, method: 'cash', status: 'completed' } });
  // Cash buyers with an email get the same QR-ticket email as online ones.
  await sendTicketEmailForBooking(id, requestOrigin());
  notifyTelegram(`💵 <b>Оплата на кассе: заказ №${b.number}</b>\nСумма: ${b.amount} ₽\nПринял(а): ${session.name}`).catch(() => {});
  revalidateTicket(id);
}
