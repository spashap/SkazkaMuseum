import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Clients() {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'clients')) redirect('/admin');
  const clients = await db.client.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { _count: { select: { bookings: true } } } });
  return (
    <>
      <h1>Клиенты (CRM)</h1>
      <p className="caption">База пополняется автоматически при переводе заявки в бронирование. Фильтры, теги, LTV и экспорт — этап 4 (PLAN.md).</p>
      {clients.length === 0 && <p className="caption">Пока нет клиентов.</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: 'var(--fs-small)' }}>
        <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid var(--cream)' }}>
          <th>ФИО</th><th>Телефон</th><th>Email</th><th>Источник</th><th>Бронирований</th>
        </tr></thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} style={{ borderBottom: '1px solid var(--cream)' }}>
              <td>{c.fullName}</td><td>{c.phone}</td><td>{c.email || '—'}</td><td>{c.source || '—'}</td><td>{c._count.bookings}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
