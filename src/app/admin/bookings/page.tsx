import Link from 'next/link';
import { Fragment } from 'react';
import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton';
import { ticketCount, ticketBreakdown } from '@/lib/ticketDetail';
import { cancelBooking, updateBookingEmail, resendTicketEmail } from './actions';

const ST: Record<string, string> = { new: 'Новая', confirmed: 'Подтверждена', paid: 'Оплачена', completed: 'Завершена', cancelled: 'Отменена' };
// Filter-chip labels (plural); paid doubles as the "sales" view.
const ST_FILTER: Record<string, string> = { new: 'Новые', confirmed: 'Подтверждённые', paid: 'Оплаченные (продажи)', completed: 'Завершённые', cancelled: 'Отменённые' };

const PAY_RU: Record<string, string> = { online: 'онлайн (ЮKassa)', cash: 'на кассе' };
// historyJson event slugs → readable Russian (some old entries use key `status`
// instead of `event` — the zayavki convert path; handled below).
const HIST_RU: Record<string, string> = {
  created: 'Заказ создан',
  new: 'Создано из заявки',
  paid_online: 'Оплачен онлайн',
  payment_canceled: 'Платёж отменён',
  cancelled: 'Бронирование отменено',
  checked_in: 'Группа пропущена',
  checkin_undone: 'Отметка входа отменена',
  paid_cash: 'Оплата принята на кассе',
};

const fmtDT = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' });

function emailStatusBadge(status: string, at: Date | null) {
  if (status === 'sent') {
    return <span className="caption" style={{ color: 'var(--forest)' }}>✉ Отправлен{at ? ` ${fmtDT.format(at)}` : ''}</span>;
  }
  if (status === 'failed') return <span className="caption" style={{ color: 'var(--crimson)' }}>Ошибка отправки</span>;
  if (status === 'no_email') return <span className="caption" style={{ color: 'var(--crimson)' }}>Нет email</span>;
  return <span className="caption">Не отправлялся</span>;
}

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
    include: { client: true, program: true, event: true },
  });
  return (
    <>
      <h1>Бронирования</h1>
      <p className="caption">Пайплайн: Новая → Подтверждена → Оплачена → Завершена → Отменена. Строка раскрывается — «подробнее» показывает все данные заказа.</p>
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
          <th>№</th><th>Клиент</th><th>Программа · сеанс</th><th>Взр.</th><th>Дет.</th><th>Всего</th><th>Льгота</th><th>Сумма</th><th>Статус</th><th>Email билета</th><th>Создано</th><th></th>
        </tr></thead>
        <tbody>
          {bookings.map((b) => {
            const history: { at?: string; event?: string; status?: string; by?: string }[] = (() => {
              try { return JSON.parse(b.historyJson || '[]'); } catch { return []; }
            })();
            const upsells: unknown[] = (() => {
              try { return JSON.parse(b.upsellsJson || '[]'); } catch { return []; }
            })();
            const email = b.buyerEmail || b.client?.email;
            return (
              <Fragment key={b.id}>
                <tr>
                  <td>{b.number}</td>
                  <td>
                    {b.client?.fullName || '—'}<br />
                    <span className="caption">{b.client?.phone}</span><br />
                    {email
                      ? <span className="caption">{email}</span>
                      : <span className="caption" style={{ color: 'var(--crimson)' }}>нет email</span>}
                  </td>
                  <td>
                    {b.program?.title || '—'}
                    {b.event && <><br /><span className="caption">сеанс {fmtDT.format(b.event.startAt)}</span></>}
                  </td>
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
                        {emailStatusBadge(b.ticketEmailStatus, b.ticketEmailAt)}
                        <form action={updateBookingEmail} style={{ display: 'flex', gap: '0.3rem', marginTop: '0.3rem' }}>
                          <input type="hidden" name="id" value={b.id} />
                          <input type="email" name="email" required defaultValue={email || ''} placeholder="email клиента" style={{ width: '11rem' }} />
                          <button className="btn btn--outline" style={{ padding: '0.3rem 0.7rem' }}>Сохранить</button>
                        </form>
                        {email && (
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
                <tr style={{ borderBottom: '1px solid var(--cream)' }}>
                  <td colSpan={12} style={{ padding: '0 0 0.4rem' }}>
                    <details>
                      <summary className="caption" style={{ cursor: 'pointer' }}>Подробнее о заказе №{b.number}</summary>
                      <div style={{ padding: '0.6rem 0 0.4rem 1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '0.5rem 1.5rem' }}>
                        <div>
                          <span className="caption">Сеанс</span><br />
                          {b.event ? <>{fmtDT.format(b.event.startAt)}{b.event.status !== 'scheduled' ? ` · ${b.event.status === 'cancelled' ? 'сеанс отменён' : b.event.status}` : ''}</> : 'без сеанса (заявка)'}
                        </div>
                        <div>
                          <span className="caption">Состав билетов</span><br />
                          {ticketBreakdown(b) || '—'}
                          {b.reducedDiscount > 0 && <><br /><span className="caption">льготная скидка {b.reducedDiscount} ₽</span></>}
                        </div>
                        <div>
                          <span className="caption">Оплата</span><br />
                          {b.amount} ₽{b.payMethod ? ` · ${PAY_RU[b.payMethod] || b.payMethod}` : ' · не оплачено'}
                          {b.paymentId && <><br /><span className="caption">ЮKassa: {b.paymentId}</span></>}
                        </div>
                        <div>
                          <span className="caption">Email билета</span><br />
                          {email || '—'}<br />
                          {emailStatusBadge(b.ticketEmailStatus, b.ticketEmailAt)}
                        </div>
                        <div>
                          <span className="caption">Клиент</span><br />
                          {b.client ? <>{b.client.fullName}<br /><span className="caption">{b.client.phone}{b.client.email ? ` · ${b.client.email}` : ''}{b.client.source ? ` · источник: ${b.client.source}` : ''}</span></> : '—'}
                        </div>
                        <div>
                          <span className="caption">Вход в музей</span><br />
                          {b.usedAt ? <>пропущены {fmtDT.format(b.usedAt)}{b.usedBy ? ` (${b.usedBy})` : ''}</> : 'ещё не приходили'}
                        </div>
                        {b.clientNote && (
                          <div>
                            <span className="caption">Комментарий клиента</span><br />{b.clientNote}
                          </div>
                        )}
                        {b.staffNote && (
                          <div>
                            <span className="caption">Заметка сотрудника</span><br />{b.staffNote}
                          </div>
                        )}
                        {upsells.length > 0 && (
                          <div>
                            <span className="caption">Допродажи</span><br />{JSON.stringify(upsells)}
                          </div>
                        )}
                        <div>
                          <span className="caption">Создано</span><br />{fmtDT.format(b.createdAt)}
                        </div>
                        {history.length > 0 && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <span className="caption">История</span><br />
                            {history.map((h, i) => {
                              const key = h.event || h.status || '';
                              return (
                                <span key={i} className="caption" style={{ display: 'block' }}>
                                  {h.at ? fmtDT.format(new Date(h.at)) : '—'} — {HIST_RU[key] || key}{h.by ? ` (${h.by})` : ''}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </details>
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
