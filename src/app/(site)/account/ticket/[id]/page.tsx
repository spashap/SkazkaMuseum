import { notFound } from 'next/navigation';
import { getTicketDetail } from '@/lib/ticketDetail';
import { requestOrigin } from '@/lib/origin';
import TicketCard from '@/components/site/TicketCard';

export const metadata = { title: 'Билет' };

// Public — no login required. The id is an unguessable cuid, same trust model
// as any e-ticket link/QR: whoever has the link can view and download it.
export default async function TicketPage({ params }: { params: { id: string } }) {
  const ticket = await getTicketDetail(params.id);
  if (!ticket) notFound();

  return (
    <section className="section container" style={{ maxWidth: 640 }}>
      <div className="section__header text-center">
        <span className="eyebrow">Билет</span>
        <h1>Заказ №{ticket.number}</h1>
      </div>
      <TicketCard t={ticket} origin={requestOrigin()} />
    </section>
  );
}
