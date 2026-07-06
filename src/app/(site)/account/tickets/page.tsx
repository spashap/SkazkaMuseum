import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentClient } from '@/lib/customerAuth';
import { requestOrigin } from '@/lib/origin';
import AccountNav from '@/components/site/AccountNav';
import TicketCard from '@/components/site/TicketCard';

export const metadata = { title: 'Все билеты' };

export default async function TicketsPage() {
  const client = await getCurrentClient();
  if (!client) redirect('/account');
  const origin = requestOrigin();

  const bookings = await db.booking.findMany({
    where: { clientId: client.id, status: { not: 'cancelled' } },
    orderBy: { createdAt: 'desc' },
    include: { event: { include: { program: true } }, client: true },
  });

  return (
    <section className="section container">
      <AccountNav active="/account/tickets" />
      <h1>Все билеты</h1>
      {bookings.length === 0 && <p className="caption">Билетов пока нет.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        {bookings.map((b) => <TicketCard key={b.id} t={b} origin={origin} />)}
      </div>
    </section>
  );
}
