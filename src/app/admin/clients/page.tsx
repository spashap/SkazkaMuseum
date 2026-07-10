import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { updateClientEmail } from './actions';

export default async function Clients({ searchParams }: { searchParams?: { err?: string } }) {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'clients')) redirect('/admin');
  const clients = await db.client.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { _count: { select: { bookings: true } } } });
  return (
    <>
      <h1>Клиенты (CRM)</h1>
      <p className="caption">База пополняется автоматически при переводе заявки в бронирование. Фильтры, теги, LTV и экспорт — этап 4 (PLAN.md).</p>
      {searchParams?.err === 'email_taken' && (
        <p className="caption" style={{ color: 'var(--crimson)', marginTop: '0.5rem' }}>
          Такой email уже указан у другого клиента — сохранение отменено.
        </p>
      )}
      {clients.length === 0 && <p className="caption">Пока нет клиентов.</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: 'var(--fs-small)' }}>
        <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid var(--cream)' }}>
          <th>ФИО</th><th>Телефон</th><th>Email</th><th>Источник</th><th>Бронирований</th>
        </tr></thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} style={{ borderBottom: '1px solid var(--cream)' }}>
              <td>{c.fullName}</td>
              <td>{c.phone}</td>
              <td>
                {c.passwordHash ? (
                  // Registered личный кабинет: the email is the client's login —
                  // they change it themselves; staff see it read-only.
                  <>{c.email || '—'}<span className="caption"> · аккаунт клиента</span></>
                ) : (
                  <form action={updateClientEmail} style={{ display: 'flex', gap: '0.3rem' }}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="email" name="email" required defaultValue={c.email || ''} placeholder="добавить email" style={{ width: '13rem' }} />
                    <button className="btn btn--outline" style={{ padding: '0.3rem 0.7rem' }}>Сохранить</button>
                  </form>
                )}
              </td>
              <td>{c.source || '—'}</td>
              <td>{c._count.bookings}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
