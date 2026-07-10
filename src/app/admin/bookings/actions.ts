'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import { ticketCount } from '@/lib/ticketDetail';
import { sendTicketEmailForBooking } from '@/lib/orderEmail';
import { requestOrigin } from '@/lib/origin';

async function requireAccess() {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'bookings')) redirect('/admin');
  return session;
}

// Cancels a booking and, if it held a seat on a session, returns that seat to
// the pool. Guarded by the current status so re-submitting a cancel is a no-op.
export async function cancelBooking(formData: FormData) {
  await requireAccess();
  const id = String(formData.get('id') || '');

  await db.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id } });
    if (!booking || booking.status === 'cancelled') return;

    // Appends to the (previously unused) history log so the customer's личный
    // кабинет can show "Заказ отменён" without a separate notifications table.
    const history = JSON.parse(booking.historyJson || '[]');
    history.push({ at: new Date().toISOString(), event: 'cancelled' });
    await tx.booking.update({ where: { id }, data: { status: 'cancelled', historyJson: JSON.stringify(history) } });

    if (booking.eventId) {
      const qty = ticketCount(booking);
      await tx.event.update({
        where: { id: booking.eventId },
        data: { booked: { decrement: qty } },
      });
    }
  });

  revalidatePath('/admin/bookings');
}

// Sets/fixes the buyer email on a booking (e.g. copied from the ЮKassa cabinet
// for orders placed before emails were persisted). Deliberately does NOT send
// anything — resending is a separate, explicit button.
export async function updateBookingEmail(formData: FormData) {
  await requireAccess();
  const id = String(formData.get('id') || '');
  const parsed = z.string().trim().toLowerCase().email().safeParse(formData.get('email'));
  if (!id || !parsed.success) return; // input type="email" already validates client-side

  const booking = await db.booking.update({ where: { id }, data: { buyerEmail: parsed.data } });
  // Same best-effort client-card backfill as checkout: fill only an empty card,
  // never overwrite, and swallow a Client.email @unique conflict.
  if (booking.clientId) {
    try {
      await db.client.updateMany({
        where: { id: booking.clientId, email: null },
        data: { email: parsed.data },
      });
    } catch {}
  }
  revalidatePath('/admin/bookings');
}

// «Отправить билет» — (re)sends the paid-ticket email and records the outcome
// in ticketEmailStatus, which the badge and «Проблемы с email» filter show.
export async function resendTicketEmail(formData: FormData) {
  await requireAccess();
  const id = String(formData.get('id') || '');
  const booking = await db.booking.findUnique({ where: { id } });
  if (!booking || !booking.eventId) return;
  if (booking.status !== 'paid' && booking.status !== 'completed') return;

  await sendTicketEmailForBooking(id, requestOrigin());
  revalidatePath('/admin/bookings');
}
