import Link from 'next/link';
import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton';
import { ticketCount } from '@/lib/ticketDetail';
import { cancelBooking } from './actions';

const ST: Record<string, string> = { new: 'Новая', confirmed: 'Подтверждена', paid: 'Оплачена', completed: 'Завершена', cancelled: 'Отменена' };
// Filter-chip labels (plural); paid doubles as the "sales" view.
const ST_FILTER: Record<string, string> = { new: 'Новые', confirmed: 'Подтверждённые', paid: 'Оплаченные (продажи)', completed: 'Завершённые', cancelled: 'Отменённые' };

export default async function Bookings({ searchParams }: { searchParams?: { status?: string } }) {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'bookings')) redirect('/admin');
  const status = searchParams?.status && ST[searchParams.status] ? searchParams.status : undefined;
  const bookings = await db.booking.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { client: true, program: true },
  });
  return (
    <>
      <h1>Бронирования</h1>
      <p className="caption">Пайплайн: Новая → Подтверждена → Оплачена → Завершена → Отменена. Полная карточка и смена статуса — этап 4 (PLAN.md).</p>
      <div className="toolbar">
        <Link href="/admin/bookings" className={`view-toggle${!status ? ' view-toggle--active' : ''}`}>Все</Link>
        {Object.entries(ST_FILTER).map(([key, label]) => (
          <Link key={key} href={`/admin/bookings?status=${key}`} className={`view-toggle${status === key ? ' view-toggle--active' : ''}`}>
            {label}
          </Link>
        ))}
      </div>
      {bookings.length === 0 && <p className="caption" style={{ marginTop: '1rem' }}>{status ? 'Нет бронирований с этим статусом.' : 'Пока нет бронирований. Создаются из раздела «Заявки» и покупок билетов на сеанс.'}</p>}
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
                {b.reduced > 0 || b.reducedChild > 0 ? (
                  <>
                    {b.reduced > 0 && <div>{b.reduced} взр. · {b.reducedCategory}</div>}
                    {b.reducedChild > 0 && <div>{b.reducedChild} дет. · {b.reducedChildCategory}</div>}
                    <span className="caption">скидка {b.reducedDiscount} ₽</span>
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
