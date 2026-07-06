import { NextResponse } from 'next/server';
import { getTicketDetail } from '@/lib/ticketDetail';
import { buildTicketPdf } from '@/lib/ticketPdf';
import { requestOrigin } from '@/lib/origin';

// Public by design — the id is an unguessable cuid, same bearer-link model as
// /account/ticket/[id] (the page this PDF mirrors).
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const ticket = await getTicketDetail(params.id);
  if (!ticket) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const pdf = await buildTicketPdf(ticket, requestOrigin(req));

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ticket-${ticket.number}.pdf"`,
    },
  });
}
