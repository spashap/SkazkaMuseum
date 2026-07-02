import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Analytics() {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'analytics')) redirect('/admin');
  const [leads, converted, clients] = await Promise.all([
    db.lead.count(),
    db.lead.count({ where: { status: 'converted' } }),
    db.client.count(),
  ]);
  const conv = leads ? Math.round((converted / leads) * 100) : 0;
  return (
    <>
      <h1>Аналитика</h1>
      <div className="grid grid--3" style={{ marginTop: '1rem' }}>
        <div className="card"><div className="card__body"><div className="caption">Всего заявок</div><div style={{ fontSize: 'var(--fs-h2)', fontWeight: 700 }}>{leads}</div></div></div>
        <div className="card"><div className="card__body"><div className="caption">Конверсия в бронь</div><div style={{ fontSize: 'var(--fs-h2)', fontWeight: 700 }}>{conv}%</div></div></div>
        <div className="card"><div className="card__body"><div className="caption">Клиентов в базе</div><div style={{ fontSize: 'var(--fs-h2)', fontWeight: 700 }}>{clients}</div></div></div>
      </div>
      <p className="caption" style={{ marginTop: '1rem' }}>Популярные программы, тепловая карта загрузки, источники, повторные визиты — этап 7 (PLAN.md). Веб-аналитика — Яндекс.Метрика (счётчик задаётся в Настройках).</p>
    </>
  );
}
