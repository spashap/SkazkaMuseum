import Link from 'next/link';
import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton';
import { ticketCount } from '@/lib/ticketDetail';
import { cancelBooking, updateBookingEmail, resendTicketEmail } from './actions';

const ST: Record<string, string> = { new: 'Новая', confirmed: 'Подтверждена', paid: 'Оплачена', completed: 'Завершена', cancelled: 'Отменена' };
// Filter-chip labels (plural); paid doubles as the "sales" view.
const ST_FILTER: Record<string, string> = { new: 'Новые', confirmed: 'Подтверждённые', paid: 'Оплаченные (продажи)', completed: 'Завершённые', cancelled: 'Отменённые' };

export default async function Bookings({ searchParams }: { searchParams?: { status?: string; email?: string } }) {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'bookings')) redirect('/admin');
  const status = searchParams?.status && ST[searchParams.status] ? searchParams.status : undefined;
  // «Проблемы с email»: paid bookings on a session whose ticket email is not
  // confirmed sent — covers 'failed', 'no_email' AND '' (paid before email
  // tracking existed). Event-less bookings (заявки) have no ticket to send.
  const emailProblem = searchParams?.email === 'problem';
  const bookings = await db.booking.findMany({
    where: emailProblem
      ? { status: { in: ['paid', 'completed'] }, eventId: { not: null }, NOT: { ticketEmailStatus: 'sent' } }
      : status
        ? { status }
        : undefined,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { client: true, program: true },
  });
  return (
    <>
      <h1>Бронирования</h1>
      <p className="caption">Пайплайн: Новая → Подтверждена → Оплачена → Завершена → Отменена. Полная карточка и смена статуса — этап 4 (PLAN.md).</p>
      <div className="toolbar">
        <Link href="/admin/bookings" className={`view-toggle${!status && !emailProblem ? ' view-toggle--active' : ''}`}>Все</Link>
        {Object.entries(ST_FILTER).map(([key, label]) => (
          <Link key={key} href={`/admin/bookings?status=${key}`} className={`view-toggle${!emailProblem && status === key ? ' view-toggle--active' : ''}`}>
            {label}
          </Link>
        ))}
        <Link href="/admin/bookings?email=problem" className={`view-toggle${emailProblem ? ' view-toggle--active' : ''}`}>⚠ Проблемы с email</Link>
      </div>
      {bookings.length === 0 && <p className="caption" style={{ marginTop: '1rem' }}>{emailProblem ? 'Нет проблем с отправкой билетов.' : status ? 'Нет бронирований с этим статусом.' : 'Пока нет бронирований. Создаются из раздела «Заявки» и покупок билетов на сеанс.'}</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: 'var(--fs-small)' }}>
        <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid var(--cream)' }}>
          <th>№</th><th>Клиент</th><th>Программа</th><th>Взр.</th><th>Дет.</th><th>Всего</th><th>Льгота</th><th>Сумма</th><th>Статус</th><th>Email билета</th><th>Создано</th><th></th>
        </tr></thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} style={{ borderBottom: '1px solid var(--cream)' }}>
              <td>{b.number}</td>
              <td>
                {b.client?.fullName || '—'}<br />
                <span className="caption">{b.client?.phone}</span><br />
                {b.buyerEmail || b.client?.email
                  ? <span className="caption">{b.buyerEmail || b.client?.email}</span>
                  : <span className="caption" style={{ color: 'var(--crimson)' }}>нет email</span>}
              </td>
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
              <td>
                {(b.status === 'paid' || b.status === 'completed') && b.eventId ? (
                  <>
                    {b.ticketEmailStatus === 'sent' ? (
                      <span className="caption" style={{ color: 'var(--forest)' }}>
                        ✉ Отправлен{b.ticketEmailAt ? ` ${new Date(b.ticketEmailAt).toLocaleDateString('ru-RU')}` : ''}
                      </span>
                    ) : b.ticketEmailStatus === 'failed' ? (
                      <span className="caption" style={{ color: 'var(--crimson)' }}>Ошибка отправки</span>
                    ) : b.ticketEmailStatus === 'no_email' ? (
                      <span className="caption" style={{ color: 'var(--crimson)' }}>Нет email</span>
                    ) : (
                      <span className="caption">Не отправлялся</span>
                    )}
                    <form action={updateBookingEmail} style={{ display: 'flex', gap: '0.3rem', marginTop: '0.3rem' }}>
                      <input type="hidden" name="id" value={b.id} />
                      <input type="email" name="email" required defaultValue={b.buyerEmail || b.client?.email || ''} placeholder="email клиента" style={{ width: '11rem' }} />
                      <button className="btn btn--outline" style={{ padding: '0.3rem 0.7rem' }}>Сохранить</button>
                    </form>
                    {(b.buyerEmail || b.client?.email) && (
                      <form action={resendTicketEmail} style={{ marginTop: '0.3rem' }}>
                        <input type="hidden" name="id" value={b.id} />
                        <button className="btn btn--outline" style={{ padding: '0.3rem 0.7rem' }}>Отправить билет</button>
                      </form>
                    )}
                  </>
                ) : (
                  '—'
                )}
              </td>
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
