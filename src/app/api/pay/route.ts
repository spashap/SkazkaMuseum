import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createEmbeddedPayment, type ReceiptItem } from '@/lib/integrations/yookassa';
import { ticketBreakdown } from '@/lib/ticketDetail';

// Starts a YooKassa payment for the bookings just created by /api/tickets/order.
// The client sends ONLY booking ids — amount, description and receipt lines are
// all recomputed from the DB (a client-sent amount would let anyone pay 1₽).
// Returns a confirmation token for the embedded widget (rendered in a modal),
// or { configured:false } while keys are missing (UI shows a fallback message).
const Schema = z.object({
  bookingIds: z.array(z.string().min(1)).min(1).max(10),
  email: z.string().trim().toLowerCase().email().optional().nullable(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const d = parsed.data;

  const bookings = await db.booking.findMany({
    where: { id: { in: d.bookingIds } },
    include: { event: { include: { program: true } }, client: true },
  });
  if (bookings.length !== d.bookingIds.length) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (bookings.some((b) => b.status !== 'new')) {
    return NextResponse.json({ error: 'not_payable' }, { status: 409 });
  }

  const amount = bookings.reduce((s, b) => s + b.amount, 0);
  if (amount <= 0) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  // One receipt line per booking: "билеты на программу X, сеанс Y" with the
  // rate breakdown in the description. YooKassa issues the fiscal receipt from
  // these lines itself (54-ФЗ is on their side).
  const items: ReceiptItem[] = bookings.map((b) => ({
    description: `Билеты: ${b.event?.program.title || 'программа'} (${ticketBreakdown(b)})`,
    amountRub: b.amount,
    quantity: 1,
  }));

  const email = d.email || bookings.find((b) => b.client?.email)?.client?.email || undefined;
  const phone = bookings.find((b) => b.client?.phone)?.client?.phone || undefined;
  if (!email && !phone) {
    // receipt.customer needs at least one contact — with phone required at
    // checkout this can't normally happen.
    return NextResponse.json({ error: 'no_contact' }, { status: 400 });
  }

  const numbers = bookings.map((b) => `№${b.number}`).join(', ');
  const result = await createEmbeddedPayment({
    amountRub: amount,
    description: `Билеты в музей: заказ ${numbers}`,
    metadata: { bookingIds: d.bookingIds.join(',') },
    customer: { email, phone },
    items,
  });

  if (!result.ok) return NextResponse.json({ configured: false, reason: result.reason });

  await db.booking.updateMany({ where: { id: { in: d.bookingIds } }, data: { paymentId: result.id } });

  return NextResponse.json({ confirmationToken: result.confirmationToken, paymentId: result.id });
}
