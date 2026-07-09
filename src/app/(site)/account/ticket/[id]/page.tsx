import { notFound } from 'next/navigation';
import { getTicketDetail } from '@/lib/ticketDetail';
import { requestOrigin } from '@/lib/origin';
import { getSession, canAccess } from '@/lib/auth';
import TicketCard from '@/components/site/TicketCard';
import CheckinPanel from '@/components/admin/CheckinPanel';

export const metadata = { title: 'Билет' };

// Public — no login required. The id is an unguessable cuid, same trust model
// as any e-ticket link/QR: whoever has the link can view and download it.
//
// Entry control rides on the SAME link: the QR in every already-sent ticket
// opens this page, and when the viewer is logged-in staff with 'checkin'
// access (the cashier's phone browser), the check-in card renders on top.
// Guests never see it; a stranger scanning someone's QR sees only the ticket.
export default async function TicketPage({ params }: { params: { id: string } }) {
  const ticket = await getTicketDetail(params.id);
  if (!ticket) notFound();

  const staff = await getSession();
  const showCheckin = staff !== null && canAccess(staff.role, 'checkin');

  return (
    <section className="section container" style={{ maxWidth: 640 }}>
      <div className="section__header text-center">
        <span className="eyebrow">Билет</span>
        <h1>Заказ №{ticket.number}</h1>
      </div>
      {showCheckin && <CheckinPanel t={ticket} staffName={staff.name} />}
      <TicketCard t={ticket} origin={requestOrigin()} />
    </section>
  );
}
