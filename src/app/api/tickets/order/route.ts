import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { notifyTelegram } from '@/lib/integrations/telegram';
import { getCurrentClient } from '@/lib/customerAuth';

// Buys tickets for one concrete Event ("Сеанс"): reserves seats and creates a
// Booking, atomically so two simultaneous orders can't oversell the same session.
const OrderSchema = z.object({
  eventId: z.string().min(1),
  fio: z.string().trim().min(1),
  phone: z.string().trim().min(3),
  date: z.string().trim().optional().nullable(),
  ticketType: z.string().trim().optional().nullable(),
  count: z.coerce.number().int().min(1).max(20),
  comment: z.string().trim().optional().nullable(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = OrderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const d = parsed.data;

  const event = await db.event.findUnique({ where: { id: d.eventId }, include: { program: true } });
  if (!event || event.status !== 'scheduled' || event.program.status !== 'active') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  // If the buyer is logged into their личный кабинет, the ticket goes straight onto
  // their account (whatever phone they typed in the form) so it's guaranteed to show
  // up there. Otherwise, unchanged guest behavior: upsert a Client by phone.
  const loggedInClient = await getCurrentClient();

  try {
    const booking = await db.$transaction(async (tx) => {
      const reserved = await tx.event.updateMany({
        where: { id: d.eventId, status: 'scheduled', booked: { lte: event.capacity - d.count } },
        data: { booked: { increment: d.count } },
      });
      if (reserved.count === 0) throw new Error('SOLD_OUT');

      const clientId = loggedInClient
        ? loggedInClient.id
        : (
            await tx.client.upsert({
              where: { phone: d.phone },
              update: { fullName: d.fio },
              create: { fullName: d.fio, phone: d.phone, source: 'tickets' },
            })
          ).id;

      const last = await tx.booking.findFirst({ orderBy: { number: 'desc' } });
      const number = (last?.number ?? 1000) + 1;

      return tx.booking.create({
        data: {
          number,
          clientId,
          programId: event.programId,
          eventId: event.id,
          adults: d.count,
          amount: event.program.priceAdult * d.count,
          status: 'new',
          clientNote: [d.ticketType, d.comment].filter(Boolean).join(' · '),
          historyJson: JSON.stringify([{ at: new Date().toISOString(), event: 'created' }]),
        },
      });
    });

    await notifyTelegram(
      `🎟 <b>Новый заказ билетов</b>\nПрограмма: ${event.program.title}\nСеанс: ${event.startAt.toLocaleString('ru-RU')}\n` +
        `Имя: ${d.fio}\nТел: ${d.phone}\nБилетов: ${d.count}`
    );

    return NextResponse.json({ ok: true, bookingId: booking.id, number: booking.number });
  } catch (e) {
    if (e instanceof Error && e.message === 'SOLD_OUT') {
      return NextResponse.json({ error: 'sold_out' }, { status: 409 });
    }
    throw e;
  }
}
