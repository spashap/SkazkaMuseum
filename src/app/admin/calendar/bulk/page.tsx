import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import BulkScheduleForm from '../BulkScheduleForm';

export default async function BulkSchedule() {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'calendar')) redirect('/admin');

  const programs = await db.program.findMany({ where: { status: 'active' }, orderBy: { title: 'asc' } });

  return (
    <>
      <h1>Массовое создание расписания</h1>
      <p className="caption">Например: каждую субботу в 13:00 до конца года. Создаёт отдельные сеансы, каждый можно потом независимо изменить или удалить.</p>
      {programs.length === 0 ? (
        <p className="caption">Сначала создайте хотя бы одну активную программу в разделе «Программы».</p>
      ) : (
        <BulkScheduleForm programs={programs} />
      )}
    </>
  );
}
