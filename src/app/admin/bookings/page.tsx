import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton';
import { ticketCount } from '@/lib/ticketDetail';
import { cancelBooking } from './actions';

const ST: Record<string, string> = { new: 'Новая', confirmed: 'Подтверждена', paid: 'Оплачена', completed: 'Завершена', cancelled: 'Отменена' };

export default async function Bookings() {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'bookings')) redirect('/admin');
  const bookings = await db.booking.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { client: true, program: true } });
  return (
    <>
      <h1>Бронирования</h1>
      <p className="caption">Пайплайн: Новая → Подтверждена → Оплачена → Завершена → Отменена. Полная карточка и смена статуса — этап 4 (PLAN.md).</p>
      {bookings.length === 0 && <p className="caption">Пока нет бронирований. Создаются из раздела «Заявки» и покупок билетов на сеанс.</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: 'var(--fs-small)' }}>
        <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid var(--cream)' }}>
          <th>№</th><th>Клиент</th><th>Программа</th><th>Взр.</th><th>Дет.</th><th>Всего</th><th>Льгота</th><th>Сумма</th><th>Статус</th><th>Создано</th><th></th>
        </tr></thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} style={{ borderBottom: '1px solid var(--cream)' }}>
              <td>{b.number}</td>
              <td>{b.client?.fullName || '—'}<br /><span className="caption">{b.client?.phone}</span></td>
              <td>{b.program?.title || '—'}</td>
              <td>{b.adults}</td>
              <td>{b.children}</td>
              <td>{ticketCount(b)}</td>
              <td>
                {b.reduced > 0 ? (
                  <>
                    {b.reduced} шт. · {b.reducedCategory}
                    <br /><span className="caption">скидка {b.reducedDiscount} ₽</span>
                  </>
                ) : '—'}
              </td>
              <td>{b.amount ? `${b.amount} ₽` : '—'}</td>
              <td>{ST[b.status]}</td>
              <td className="caption">{new Date(b.createdAt).toLocaleDateString('ru-RU')}</td>
              <td>
                {b.status !== 'cancelled' && (
                  <form action={cancelBooking}>
                    <input type="hidden" name="id" value={b.id} />
                    <ConfirmSubmitButton className="btn btn--outline" confirmMessage="Отменить бронирование? Места на сеансе будут возвращены." style={{ padding: '0.3rem 0.7rem' }}>
                      Отменить
                    </ConfirmSubmitButton>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
