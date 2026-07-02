import Link from 'next/link';
import { db } from '@/lib/db';

// Dashboard (spec 3.3): sales, today's events, notifications.
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card"><div className="card__body">
      <div className="caption">{label}</div>
      <div style={{ fontSize: 'var(--fs-h2)', fontWeight: 'var(--fw-bold)' }}>{value}</div>
    </div></div>
  );
}

export default async function Dashboard() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [revenueAgg, ticketCount, newLeads, unpaid] = await Promise.all([
    db.transaction.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: monthStart }, status: 'completed' } }),
    db.booking.count({ where: { createdAt: { gte: monthStart } } }),
    db.lead.count({ where: { status: 'new' } }),
    db.booking.count({ where: { status: 'confirmed' } }),
  ]);
  const revenue = revenueAgg._sum.amount || 0;

  return (
    <>
      <h1>Главная панель</h1>
      <div className="grid grid--3" style={{ marginTop: '1rem' }}>
        <Stat label="Выручка за месяц" value={`${revenue.toLocaleString('ru-RU')} ₽`} />
        <Stat label="Бронирований за месяц" value={ticketCount} />
        <Stat label="Новые заявки" value={newLeads} />
      </div>

      <h2 style={{ marginTop: '2rem' }}>Уведомления</h2>
      <div className="card"><div className="card__body">
        <p>🔔 Новых заявок, ожидающих обработки: <strong>{newLeads}</strong>{' '}
          {newLeads > 0 && <Link href="/admin/zayavki">→ открыть</Link>}</p>
        <p>⏳ Подтверждённых, ожидающих оплаты: <strong>{unpaid}</strong></p>
      </div></div>

      <p className="caption" style={{ marginTop: '2rem' }}>
        График выручки по дням и блок «Мероприятия сегодня» подключаются на этапе 4 (см. PLAN.md).
      </p>
    </>
  );
}
