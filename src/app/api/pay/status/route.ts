import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyAndApplyPayment } from '@/lib/payments';
import { requestOrigin } from '@/lib/origin';

// Polled by the checkout modal while the YooKassa widget is open. Normally the
// webhook marks the bookings paid and this just reads the DB; if the webhook is
// late (or unreachable — localhost dev), it falls back to verifying the payment
// against the YooKassa API directly, through the same idempotent code path.
const Schema = z.object({ paymentId: z.string().min(1) });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const { paymentId } = parsed.data;

  const bookings = await db.booking.findMany({ where: { paymentId }, select: { status: true } });
  if (bookings.length === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (bookings.every((b) => b.status === 'paid')) {
    return NextResponse.json({ status: 'paid' });
  }

  const status = await verifyAndApplyPayment(paymentId, requestOrigin(req));
  if (status === 'succeeded') return NextResponse.json({ status: 'paid' });
  if (status === 'canceled') return NextResponse.json({ status: 'canceled' });
  return NextResponse.json({ status: 'pending' });
}
