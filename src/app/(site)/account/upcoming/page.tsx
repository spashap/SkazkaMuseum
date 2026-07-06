import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentClient } from '@/lib/customerAuth';
import { requestOrigin } from '@/lib/origin';
import AccountNav from '@/components/site/AccountNav';
import TicketCard from '@/components/site/TicketCard';

export const metadata = { title: 'Мои ближайшие мероприятия' };

export default async function UpcomingPage() {
  const client = await getCurrentClient();
  if (!client) redirect('/account');
  const origin = requestOrigin();

  const bookings = await db.booking.findMany({
    where: { clientId: client.id, status: { not: 'cancelled' }, event: { startAt: { gte: new Date() } } },
    orderBy: { event: { startAt: 'asc' } },
    include: { event: { include: { program: true } }, client: true },
  });

  return (
    <section className="section container">
      <AccountNav active="/account/upcoming" />
      <h1>Мои ближайшие мероприятия</h1>
      {bookings.length === 0 && <p className="caption">Предстоящих мероприятий нет.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        {bookings.map((b) => <TicketCard key={b.id} t={b} origin={origin} />)}
      </div>
    </section>
  );
}
