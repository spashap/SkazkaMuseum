import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import { updateProgram, addUpsell, deleteUpsell } from '../actions';
import ProgramForm from '../ProgramForm';
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton';

export default async function EditProgram({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'programs')) redirect('/admin');

  const program = await db.program.findUnique({ where: { id: params.id }, include: { upsells: true } });
  if (!program) notFound();

  return (
    <>
      <Link href="/admin/programs" className="caption">← К каталогу программ</Link>
      <h1>Редактирование программы</h1>
      <ProgramForm program={program} action={updateProgram} />

      <h2 style={{ marginTop: '2rem' }}>Дополнительные услуги / upsell</h2>
      {program.upsells.length === 0 && <p className="caption">Пока не добавлены.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 720 }}>
        {program.upsells.map((u) => (
          <div key={u.id} className="card"><div className="card__body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1.2rem' }}>
            <div>
              <strong>{u.title}</strong> — {u.price} ₽
              {u.description && <p className="small" style={{ margin: 0 }}>{u.description}</p>}
            </div>
            <form action={deleteUpsell}>
              <input type="hidden" name="id" value={u.id} />
              <input type="hidden" name="programId" value={program.id} />
              <ConfirmSubmitButton className="btn btn--outline" confirmMessage="Удалить услугу?" style={{ padding: '0.4rem 0.9rem' }}>Удалить</ConfirmSubmitButton>
            </form>
          </div></div>
        ))}
      </div>

      <form action={addUpsell} style={{ maxWidth: 480, marginTop: '1rem' }}>
        <input type="hidden" name="programId" value={program.id} />
        <div className="field"><label>Название услуги</label><input name="title" required /></div>
        <div className="field"><label>Описание</label><input name="description" /></div>
        <div className="field"><label>Цена, ₽</label><input name="price" type="number" min={0} defaultValue={0} /></div>
        <button className="btn btn--outline">+ Добавить услугу</button>
      </form>
    </>
  );
}
