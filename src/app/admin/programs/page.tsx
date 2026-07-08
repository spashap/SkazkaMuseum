import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import { duplicateProgram, archiveProgram } from './actions';
import ProgramFilters from '@/components/admin/ProgramFilters';
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton';
import DeleteProgramButton from '@/components/admin/DeleteProgramButton';
import type { Prisma } from '@prisma/client';
import { programTypeLabel } from '@/lib/programTypes';

const STATUS_RU: Record<string, string> = { active: 'Активна', draft: 'Черновик', archived: 'В архиве' };
const STATUS_BADGE: Record<string, string> = { active: 'badge--active', draft: 'badge--draft', archived: 'badge--archived' };

export default async function Programs({ searchParams }: { searchParams: { type?: string; status?: string; q?: string } }) {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'programs')) redirect('/admin');

  const type = searchParams.type || '';
  const status = searchParams.status || '';
  const q = searchParams.q || '';

  const where: Prisma.ProgramWhereInput = {
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
    ...(q ? { title: { contains: q } } : {}),
  };

  const programs = await db.program.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { upsells: true, events: true } } },
  });

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Мероприятия (каталог программ)</h1>
          <p className="caption">Справочник программ: создание, редактирование, цены и допуслуги (upsell).</p>
        </div>
        <Link href="/admin/programs/new" className="btn">+ Создать программу</Link>
      </div>

      <ProgramFilters type={type} status={status} q={q} />

      {programs.length === 0 && <p className="caption">Программы не найдены.</p>}

      <div className="grid grid--3" style={{ marginTop: '1rem' }}>
        {programs.map((p) => {
          const cover = (JSON.parse(p.images || '[]')[0] as string | undefined);
          return (
            <div key={p.id} className="card">
              {cover && <img src={cover} alt="" loading="lazy" style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover' }} />}
              <div className="card__body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0 }}>{p.title}</h3>
                  <span className={`badge ${STATUS_BADGE[p.status] || ''}`}>{STATUS_RU[p.status] || p.status}</span>
                </div>
                <p className="small">{programTypeLabel(p.type)} · {p.durationMin} мин · {p.minGroup}–{p.maxGroup} чел.</p>
                <p className="small">Взрослый: {p.priceAdult} ₽ · Детский: {p.priceChild} ₽ · Группа: {p.priceGroup} ₽</p>
                <p className="caption">Допуслуг: {p._count.upsells} · Связанных событий: {p._count.events}</p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <Link href={`/admin/programs/${p.id}`} className="btn" style={{ padding: '0.4rem 0.9rem' }}>Редактировать</Link>
                  <form action={duplicateProgram}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="btn btn--outline" style={{ padding: '0.4rem 0.9rem' }}>Дублировать</button>
                  </form>
                  <form action={archiveProgram}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="btn btn--outline" style={{ padding: '0.4rem 0.9rem' }}>{p.status === 'archived' ? 'Вернуть из архива' : 'Архивировать'}</button>
                  </form>
                  <DeleteProgramButton id={p.id} title={p.title} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
