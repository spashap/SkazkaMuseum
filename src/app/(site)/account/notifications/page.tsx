import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentClient } from '@/lib/customerAuth';
import AccountNav from '@/components/site/AccountNav';

export const metadata = { title: 'Уведомления' };

const EVENT_RU: Record<string, string> = { created: 'создан', cancelled: 'отменён' };

type Notification = { at: string; text: string };

export default async function NotificationsPage() {
  const client = await getCurrentClient();
  if (!client) redirect('/account');

  const bookings = await db.booking.findMany({
    where: { clientId: client.id },
    include: { event: { include: { program: true } } },
  });

  // Derived entirely from data that already exists (Booking.historyJson,
  // Event.status/rescheduledAt) — no separate notifications table.
  const items: Notification[] = [];
  for (const b of bookings) {
    let history: { at: string; event: string }[] = [];
    try { history = JSON.parse(b.historyJson || '[]'); } catch { /* ignore malformed */ }
    for (const h of history) {
      items.push({ at: h.at, text: `Заказ №${b.number} ${EVENT_RU[h.event] || h.event}` });
    }
    if (b.event?.status === 'cancelled') {
      items.push({ at: b.event.updatedAt.toISOString(), text: `Мероприятие «${b.event.program.title}» (заказ №${b.number}) отменено` });
    }
    if (b.event?.rescheduledAt) {
      items.push({
        at: b.event.rescheduledAt.toISOString(),
        text: `Мероприятие «${b.event.program.title}» (заказ №${b.number}) перенесено — новое время: ${b.event.startAt.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
      });
    }
  }
  items.sort((a, c) => c.at.localeCompare(a.at));

  return (
    <section className="section container">
      <AccountNav active="/account/notifications" />
      <h1>Уведомления</h1>
      {items.length === 0 && <p className="caption">Пока нет уведомлений.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
        {items.map((n, i) => (
          <div key={i} className="program-card" style={{ padding: '1rem' }}>
            <p style={{ margin: 0 }}>{n.text}</p>
            <p className="caption" style={{ margin: 0 }}>{new Date(n.at).toLocaleString('ru-RU')}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
