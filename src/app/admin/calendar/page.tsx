import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Calendar() {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'calendar')) redirect('/admin');
  const events = await db.event.findMany({ orderBy: { startAt: 'asc' }, take: 100, include: { program: true } });
  return (
    <>
      <h1>Календарь мероприятий</h1>
      <p className="caption">Интерактивный календарь месяц/неделя/день с drag&drop — этап 4 (PLAN.md). Ниже — ближайшие события.</p>
      {events.length === 0 && <p className="caption">Событий пока нет. Создаются из программ каталога.</p>}
      <ul style={{ marginTop: '1rem' }}>
        {events.map((e) => (
          <li key={e.id} className="small">
            {new Date(e.startAt).toLocaleString('ru-RU')} — {e.program.title} ({e.booked}/{e.capacity} мест){e.assignee ? ` · ${e.assignee}` : ''}
          </li>
        ))}
      </ul>
    </>
  );
}
