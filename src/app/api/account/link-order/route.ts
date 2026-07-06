import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentClient } from '@/lib/customerAuth';

const Schema = z.object({ phone: z.string().trim().min(3), orderNumber: z.coerce.number().int() });

// Attaches a guest order (placed without logging in) to the current account.
// Only reassigns bookings that belong to a still-unclaimed guest Client (no
// passwordHash) — can't be used to pull bookings out of someone else's real account.
export async function POST(req: Request) {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const booking = await db.booking.findFirst({
    where: { number: parsed.data.orderNumber, client: { phone: parsed.data.phone, passwordHash: null } },
  });
  if (!booking) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  await db.booking.update({ where: { id: booking.id }, data: { clientId: client.id } });
  return NextResponse.json({ ok: true });
}
