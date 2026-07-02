import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import { redirect } from 'next/navigation';

const TYPE_RU: Record<string, string> = { excursion: 'Экскурсия', quest: 'Квест', theatre: 'Театр', lecture: 'Лекция', masterclass: 'Мастер-класс', birthday: 'День рождения', partner: 'Партнёрское' };

export default async function Programs() {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'programs')) redirect('/admin');
  const programs = await db.program.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { upsells: true, events: true } } } });
  return (
    <>
      <h1>Мероприятия (каталог программ)</h1>
      <p className="caption">Справочник программ. Создание/редактирование карточек, цен и допуслуг (upsell) — этап 5 (PLAN.md).</p>
      <div className="grid grid--3" style={{ marginTop: '1rem' }}>
        {programs.map((p) => (
          <div key={p.id} className="card"><div className="card__body">
            <h3>{p.title}</h3>
            <p className="small">{TYPE_RU[p.type] || p.type} · {p.durationMin} мин · до {p.maxGroup} чел.</p>
            <p className="small">Взрослый: {p.priceAdult} ₽ · Детский: {p.priceChild} ₽</p>
            <span className="caption">Допуслуг: {p._count.upsells} · Событий: {p._count.events} · {p.status}</span>
          </div></div>
        ))}
      </div>
    </>
  );
}
