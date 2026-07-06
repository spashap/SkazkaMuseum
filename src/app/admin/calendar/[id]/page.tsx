import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton';
import SessionForm from '../SessionForm';
import { updateSession, cancelSession, toggleHideSession, deleteSession } from '../actions';

export default async function EditSession({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'calendar')) redirect('/admin');

  const [event, programs] = await Promise.all([
    db.event.findUnique({ where: { id: params.id }, include: { _count: { select: { bookings: true } } } }),
    db.program.findMany({ where: { status: 'active' }, orderBy: { title: 'asc' } }),
  ]);
  if (!event) redirect('/admin/calendar');

  return (
    <>
      <h1>Сеанс</h1>
      <p className="caption">
        Изменения затрагивают только этот сеанс — остальные сеансы серии не меняются.
        {event._count.bookings > 0 && ` Связанных бронирований: ${event._count.bookings}.`}
      </p>

      <SessionForm programs={programs} event={event} action={updateSession} />

      <h2 style={{ marginTop: '2rem' }}>Действия</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
        <form action={cancelSession}>
          <input type="hidden" name="id" value={event.id} />
          <ConfirmSubmitButton className="btn btn--outline" confirmMessage="Отменить этот сеанс?">Отменить сеанс</ConfirmSubmitButton>
        </form>
        <form action={toggleHideSession}>
          <input type="hidden" name="id" value={event.id} />
          <button className="btn btn--outline">{event.status === 'hidden' ? 'Показать на сайте' : 'Скрыть с сайта'}</button>
        </form>
        <form action={deleteSession}>
          <input type="hidden" name="id" value={event.id} />
          <ConfirmSubmitButton className="btn btn--outline" confirmMessage="Удалить сеанс безвозвратно?">Удалить</ConfirmSubmitButton>
        </form>
      </div>
    </>
  );
}
