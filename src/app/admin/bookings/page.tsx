import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import { redirect } from 'next/navigation';

const ST: Record<string, string> = { new: 'Новая', confirmed: 'Подтверждена', paid: 'Оплачена', completed: 'Завершена', cancelled: 'Отменена' };

export default async function Bookings() {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'bookings')) redirect('/admin');
  const bookings = await db.booking.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { client: true, program: true } });
  return (
    <>
      <h1>Бронирования</h1>
      <p className="caption">Пайплайн: Новая → Подтверждена → Оплачена → Завершена → Отменена. Полная карточка и смена статуса — этап 4 (PLAN.md).</p>
      {bookings.length === 0 && <p className="caption">Пока нет бронирований. Создаются из раздела «Заявки».</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: 'var(--fs-small)' }}>
        <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid var(--cream)' }}>
          <th>№</th><th>Клиент</th><th>Программа</th><th>Чел.</th><th>Сумма</th><th>Статус</th><th>Создано</th>
        </tr></thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} style={{ borderBottom: '1px solid var(--cream)' }}>
              <td>{b.number}</td>
              <td>{b.client?.fullName || '—'}<br /><span className="caption">{b.client?.phone}</span></td>
              <td>{b.program?.title || '—'}</td>
              <td>{b.adults + b.children}</td>
              <td>{b.amount ? `${b.amount} ₽` : '—'}</td>
              <td>{ST[b.status]}</td>
              <td className="caption">{new Date(b.createdAt).toLocaleDateString('ru-RU')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
