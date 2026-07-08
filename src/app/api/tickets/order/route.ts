import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { notifyTelegram } from '@/lib/integrations/telegram';
import { getCurrentClient } from '@/lib/customerAuth';
import { sessionRates, findRate } from '@/lib/rates';
import { isReducedCategory } from '@/lib/reducedTickets';
import { ticketBreakdown } from '@/lib/ticketDetail';
import { sendOrderConfirmationEmail } from '@/lib/orderEmail';

// Buys tickets for one concrete Event ("Сеанс"): reserves seats and creates a single
// Booking covering any mix of rates (adult/child/reduced/...), atomically so two
// simultaneous orders can't oversell the same session.
const RateItemSchema = z.object({
  rateId: z.string().min(1),
  qty: z.coerce.number().int().min(0).max(20),
  category: z.string().trim().optional().nullable(),
});

const OrderSchema = z.object({
  eventId: z.string().min(1),
  fio: z.string().trim().min(1),
  phone: z.string().trim().min(3),
  email: z.string().trim().toLowerCase().email().optional().nullable(),
  date: z.string().trim().optional().nullable(),
  items: z.array(RateItemSchema).min(1),
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

  // Every rate is priced and validated against the DB's own rate list — never trust a
  // client-sent id/qty/price. This also re-enforces the льготный-билет rules (program
  // eligibility, valid category) exactly as before, just per-rate instead of whole-order.
  const availableRates = sessionRates(event.program);
  let adults = 0, children = 0, reduced = 0, reducedCategory = '', amount = 0, discount = 0, count = 0;

  for (const li of d.items) {
    if (li.qty <= 0) continue;
    const rate = findRate(availableRates, li.rateId);
    if (!rate) return NextResponse.json({ error: 'invalid_rate' }, { status: 400 });
    count += li.qty;
    amount += rate.unitPrice * li.qty;
    if (li.rateId === 'adult') adults += li.qty;
    else if (li.rateId === 'child') children += li.qty;
    else if (li.rateId === 'reduced') {
      if (!li.category || !isReducedCategory(li.category)) {
        return NextResponse.json({ error: 'invalid_reduced_category' }, { status: 400 });
      }
      reduced += li.qty;
      reducedCategory = li.category;
      discount += (event.program.priceAdult - rate.unitPrice) * li.qty;
    }
  }
  if (count === 0 || count > 20) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  // If the buyer is logged into their личный кабинет, the ticket goes straight onto
  // their account (whatever phone they typed in the form) so it's guaranteed to show
  // up there. Otherwise, unchanged guest behavior: upsert a Client by phone.
  const loggedInClient = await getCurrentClient();

  try {
    const booking = await db.$transaction(async (tx) => {
      const reserved = await tx.event.updateMany({
        where: { id: d.eventId, status: 'scheduled', booked: { lte: event.capacity - count } },
        data: { booked: { increment: count } },
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
          adults,
          children,
          reduced,
          reducedCategory,
          reducedDiscount: discount,
          amount,
          status: 'new',
          clientNote: [ticketBreakdown({ adults, children, reduced, reducedCategory }), d.comment].filter(Boolean).join(' · '),
          historyJson: JSON.stringify([{ at: new Date().toISOString(), event: 'created' }]),
        },
      });
    });

    await notifyTelegram(
      `🎟 <b>Новый заказ билетов</b>\nПрограмма: ${event.program.title}\nСеанс: ${event.startAt.toLocaleString('ru-RU')}\n` +
        `Имя: ${d.fio}\nТел: ${d.phone}\n${ticketBreakdown({ adults, children, reduced, reducedCategory })}`
    );

    const emailTo = d.email || loggedInClient?.email;
    if (emailTo) {
      sendOrderConfirmationEmail({ to: emailTo, toName: d.fio, program: event.program, event, booking }).catch(() => {});
    }

    return NextResponse.json({ ok: true, bookingId: booking.id, number: booking.number, amount, discount });
  } catch (e) {
    if (e instanceof Error && e.message === 'SOLD_OUT') {
      return NextResponse.json({ error: 'sold_out' }, { status: 409 });
    }
    throw e;
  }
}
