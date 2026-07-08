'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import { ticketCount } from '@/lib/ticketDetail';

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
