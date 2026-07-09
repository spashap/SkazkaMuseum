import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentClient } from '@/lib/customerAuth';
import { getTicketDetail } from '@/lib/ticketDetail';
import { buildTicketPdf } from '@/lib/ticketPdf';
import { sendEmail } from '@/lib/integrations/mail';
import { requestOrigin } from '@/lib/origin';

const Schema = z.object({ email: z.string().trim().toLowerCase().email().optional() });

// Works both from the logged-in "Все билеты" list (defaults to the account's
// own email) and from the public bearer ticket page (caller supplies an email
// to send a copy to) — same bearer-link trust model as the PDF/ICS downloads.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const ticket = await getTicketDetail(params.id);
  if (!ticket) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const client = await getCurrentClient();
  const to = parsed.data.email || client?.email;
  if (!to) return NextResponse.json({ error: 'no_email' }, { status: 400 });

  const pdf = await buildTicketPdf(ticket, requestOrigin(req));
  const company = await db.companySettings.findUnique({ where: { id: 1 } });

  const sent = await sendEmail({
    to, toName: ticket.client?.fullName || '',
    fromName: company?.name || 'Музей русской сказки', replyTo: company?.email || undefined,
    subject: `Ваш билет №${ticket.number} — ${ticket.event?.program.title || ''}`,
    html: `<p>Билет №${ticket.number}${ticket.event ? ` на «${ticket.event.program.title}»` : ''} во вложении.</p>`,
    attachment: { filename: `ticket-${ticket.number}.pdf`, contentType: 'application/pdf', content: pdf },
  });

  // sendEmail() no-ops (logs) without a configured UniSender key — still respond
  // ok so the UI doesn't show a false error in dev.
  return NextResponse.json({ ok: true, delivered: sent });
}
