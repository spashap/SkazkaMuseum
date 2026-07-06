import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import SessionForm from '../SessionForm';
import { createSession } from '../actions';

export default async function NewSession() {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'calendar')) redirect('/admin');

  const programs = await db.program.findMany({ where: { status: 'active' }, orderBy: { title: 'asc' } });

  return (
    <>
      <h1>Новый сеанс</h1>
      <p className="caption">Конкретная дата и время для одной из программ каталога.</p>
      {programs.length === 0 ? (
        <p className="caption">Сначала создайте хотя бы одну активную программу в разделе «Программы».</p>
      ) : (
        <SessionForm programs={programs} action={createSession} />
      )}
    </>
  );
}
