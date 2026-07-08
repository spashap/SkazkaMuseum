import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTicketDetail, ticketCount, ticketBreakdown } from '@/lib/ticketDetail';
import { buildIcs } from '@/lib/calendarLinks';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const ticket = await getTicketDetail(params.id);
  if (!ticket || !ticket.event) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const company = await db.companySettings.findUnique({ where: { id: 1 } });

  const ics = buildIcs({
    title: ticket.event.program.title,
    description: `Заказ №${ticket.number} · ${ticketCount(ticket)} билет(ов)`
      + (ticket.children > 0 || ticket.reduced > 0 ? ` (${ticketBreakdown(ticket)})` : ''),
    location: company?.address || '',
    startAt: ticket.event.startAt,
    endAt: ticket.event.endAt,
  });
  if (!ics) return NextResponse.json({ error: 'generation_failed' }, { status: 500 });

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="ticket-${ticket.number}.ics"`,
    },
  });
}
