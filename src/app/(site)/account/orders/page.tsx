import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentClient } from '@/lib/customerAuth';
import AccountNav from '@/components/site/AccountNav';
import OrdersFilters from '@/components/site/OrdersFilters';
import ReducedTicketNotice from '@/components/site/ReducedTicketNotice';
import { ticketCount, ticketBreakdown } from '@/lib/ticketDetail';
import type { Prisma } from '@prisma/client';

export const metadata = { title: 'История заказов' };

const STATUS_RU: Record<string, string> = {
  new: 'Новая', confirmed: 'Подтверждена', paid: 'Оплачена', completed: 'Завершена', cancelled: 'Отменена',
};

export default async function OrdersPage({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const client = await getCurrentClient();
  if (!client) redirect('/account');

  const status = searchParams.status || '';
  const q = searchParams.q || '';

  const where: Prisma.BookingWhereInput = {
    clientId: client.id,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            ...(Number.isFinite(Number(q)) ? [{ number: Number(q) }] : []),
            { event: { program: { title: { contains: q } } } },
          ],
        }
      : {}),
  };

  const orders = await db.booking.findMany({
    where, orderBy: { createdAt: 'desc' },
    include: { event: { include: { program: true } } },
  });

  return (
    <section className="section container">
      <AccountNav active="/account/orders" />
      <h1>История заказов</h1>
      <OrdersFilters status={status} q={q} />
      {orders.length === 0 && <p className="caption" style={{ marginTop: '1rem' }}>Заказов не найдено.</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--cream)' }}>
            <th style={{ padding: '0.5rem' }}>№</th>
            <th style={{ padding: '0.5rem' }}>Мероприятие</th>
            <th style={{ padding: '0.5rem' }}>Дата</th>
            <th style={{ padding: '0.5rem' }}>Билетов</th>
            <th style={{ padding: '0.5rem' }}>Сумма</th>
            <th style={{ padding: '0.5rem' }}>Статус</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} style={{ borderBottom: '1px solid var(--cream)' }}>
              <td style={{ padding: '0.5rem' }}>№{o.number}</td>
              <td style={{ padding: '0.5rem' }}>{o.event?.program.title || '—'}</td>
              <td style={{ padding: '0.5rem' }}>{o.event ? o.event.startAt.toLocaleDateString('ru-RU') : '—'}</td>
              <td style={{ padding: '0.5rem' }}>
                {ticketCount(o)}
                {(o.children > 0 || o.reduced > 0) && <><br /><span className="caption">{ticketBreakdown(o)}</span></>}
              </td>
              <td style={{ padding: '0.5rem' }}>{o.amount ? `${o.amount} ₽` : '—'}</td>
              <td style={{ padding: '0.5rem' }}>{STATUS_RU[o.status] || o.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.some((o) => o.reduced > 0) && <ReducedTicketNotice style={{ marginTop: '1.5rem' }} />}
    </section>
  );
}
