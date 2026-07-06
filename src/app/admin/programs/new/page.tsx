import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, canAccess } from '@/lib/auth';
import { createProgram } from '../actions';
import ProgramForm from '../ProgramForm';

export default async function NewProgram() {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'programs')) redirect('/admin');

  return (
    <>
      <Link href="/admin/programs" className="caption">← К каталогу программ</Link>
      <h1>Новая программа</h1>
      <ProgramForm action={createProgram} />
    </>
  );
}
