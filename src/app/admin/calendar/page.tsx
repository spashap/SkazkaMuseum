import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import CalendarFilters from '@/components/admin/CalendarFilters';
import { freeSeats } from '@/lib/sessions';
import type { Prisma } from '@prisma/client';

const STATUS_RU: Record<string, string> = { scheduled: 'Запланирован', cancelled: 'Отменён', hidden: 'Скрыт' };
const STATUS_BADGE: Record<string, string> = { scheduled: 'badge--active', cancelled: 'badge--archived', hidden: 'badge--draft' };
const WD_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MON_NOM = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const WD_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function parseDateParam(s?: string): Date {
  if (s) {
    const d = new Date(`${s}T00:00:00`);
    if (!isNaN(d.getTime())) return d;
  }
  return startOfToday();
}
function viewHref(view: string, anchor: Date, type: string): string {
  const params = new URLSearchParams({ view, date: dateKey(anchor) });
  if (type) params.set('type', type);
  return `/admin/calendar?${params.toString()}`;
}

export default async function Calendar({
  searchParams,
}: {
  searchParams: { view?: string; date?: string; type?: string };
}) {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'calendar')) redirect('/admin');

  const view = searchParams.view === 'week' || searchParams.view === 'list' ? searchParams.view : 'month';
  const type = searchParams.type || '';
  const anchor = parseDateParam(searchParams.date);
  const hadExplicitDate = !!searchParams.date;
  const where: Prisma.EventWhereInput = type ? { program: { type } } : {};

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Календарь мероприятий</h1>
          <p className="caption">Сеансы программ: расписание, массовое создание, отмена и скрытие отдельных сеансов.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/admin/calendar/new" className="btn">+ Создать сеанс</Link>
          <Link href="/admin/calendar/bulk" className="btn btn--outline">Массовое расписание</Link>
        </div>
      </div>

      <div className="toolbar" style={{ alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {(['month', 'week', 'list'] as const).map((v) => (
            <Link
              key={v}
              href={viewHref(v, anchor, type)}
              className="btn btn--outline"
              style={view === v ? { background: 'var(--gold)', color: 'var(--dark)', borderColor: 'var(--gold)' } : undefined}
            >
              {v === 'month' ? 'Месяц' : v === 'week' ? 'Неделя' : 'Список'}
            </Link>
          ))}
        </div>
        <CalendarFilters view={view} date={dateKey(anchor)} type={type} />
      </div>

      {view === 'month' && <MonthView anchor={anchor} type={type} where={where} />}
      {view === 'week' && <WeekView anchor={anchor} type={type} where={where} />}
      {view === 'list' && <ListView anchor={anchor} where={where} filterToDate={hadExplicitDate} />}
    </>
  );
}

async function MonthView({ anchor, type, where }: { anchor: Date; type: string; where: Prisma.EventWhereInput }) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 1);
  const events = await db.event.findMany({
    where: { ...where, status: 'scheduled', startAt: { gte: from, lt: to } },
    select: { startAt: true, capacity: true, booked: true },
  });
  const stats = new Map<string, { count: number; sold: number; free: number }>();
  for (const e of events) {
    const k = dateKey(e.startAt);
    const s = stats.get(k) || { count: 0, sold: 0, free: 0 };
    s.count += 1;
    s.sold += e.booked;
    s.free += freeSeats(e);
    stats.set(k, s);
  }

  const prevMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);
  const startWd = (from.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = startOfToday();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWd; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div className="card" style={{ marginTop: '1rem', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Link href={viewHref('month', prevMonth, type)} className="btn btn--outline" style={{ padding: '0.3rem 0.7rem' }}>&larr;</Link>
        <strong>{MON_NOM[month]} {year}</strong>
        <Link href={viewHref('month', nextMonth, type)} className="btn btn--outline" style={{ padding: '0.3rem 0.7rem' }}>&rarr;</Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.4rem' }}>
        {WD_SHORT.map((w) => <div key={w} className="caption" style={{ textAlign: 'center', fontWeight: 600 }}>{w}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const k = dateKey(d);
          const dayStats = stats.get(k);
          const count = dayStats?.count || 0;
          const isToday = d.getTime() === today.getTime();
          const content = (
            <div
              style={{
                border: isToday ? '2px solid var(--gold)' : '1px solid rgba(0,0,0,0.08)',
                borderRadius: 'var(--radius)',
                padding: '0.5rem',
                minHeight: '4.4rem',
                background: count > 0 ? 'rgba(139,26,47,0.06)' : 'transparent',
              }}
            >
              <div>{d.getDate()}</div>
              {dayStats && (
                <>
                  <div className="caption" style={{ color: 'var(--crimson)', fontWeight: 700 }}>{count} сеанс.</div>
                  <div className="caption" style={{ lineHeight: 1.3 }}>Продано {dayStats.sold} · Своб. {dayStats.free}</div>
                </>
              )}
            </div>
          );
          return count > 0 ? (
            <Link key={k} href={viewHref('list', d, type)} style={{ color: 'inherit', textDecoration: 'none' }}>{content}</Link>
          ) : (
            <div key={k}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}

async function WeekView({ anchor, type, where }: { anchor: Date; type: string; where: Prisma.EventWhereInput }) {
  const wd = (anchor.getDay() + 6) % 7; // Mon=0
  const monday = new Date(anchor);
  monday.setDate(monday.getDate() - wd);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 7);

  const events = await db.event.findMany({
    where: { ...where, startAt: { gte: monday, lt: sunday } },
    orderBy: { startAt: 'asc' },
    include: { program: true },
  });

  const prevWeek = new Date(monday);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const nextWeek = new Date(monday);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const days: { date: Date; events: typeof events }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    days.push({ date: d, events: events.filter((e) => dateKey(e.startAt) === dateKey(d)) });
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Link href={viewHref('week', prevWeek, type)} className="btn btn--outline" style={{ padding: '0.3rem 0.7rem' }}>&larr; Пред. неделя</Link>
        <strong>{dateKey(monday)} — {dateKey(days[6].date)}</strong>
        <Link href={viewHref('week', nextWeek, type)} className="btn btn--outline" style={{ padding: '0.3rem 0.7rem' }}>След. неделя &rarr;</Link>
      </div>
      {days.map(({ date, events: dayEvents }) => (
        <div key={dateKey(date)} className="card" style={{ marginBottom: '0.75rem', padding: '1rem' }}>
          <strong>{WD_FULL[(date.getDay() + 6) % 7]}, {date.getDate()} {MON_NOM[date.getMonth()].toLowerCase()}</strong>
          {dayEvents.length === 0 && <p className="caption" style={{ marginTop: '0.4rem' }}>Сеансов нет</p>}
          {dayEvents.map((e) => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.5rem', fontSize: 'var(--fs-small)' }}>
              <span>
                {e.startAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}–
                {e.endAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} · <Link href={`/admin/calendar/${e.id}`}>{e.program.title}</Link>
              </span>
              <span>
                <span className={`badge ${STATUS_BADGE[e.status] || ''}`}>{STATUS_RU[e.status] || e.status}</span>
                {' '}Продано {e.booked} · Своб. {freeSeats(e)}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

async function ListView({ anchor, where, filterToDate }: { anchor: Date; where: Prisma.EventWhereInput; filterToDate: boolean }) {
  const from = filterToDate ? anchor : startOfToday();
  let to: Date | undefined;
  if (filterToDate) {
    to = new Date(anchor);
    to.setDate(to.getDate() + 1);
  }

  const events = await db.event.findMany({
    where: { ...where, startAt: to ? { gte: from, lt: to } : { gte: from } },
    orderBy: { startAt: 'asc' },
    take: 100,
    include: { program: true },
  });

  return (
    <div style={{ marginTop: '1rem' }}>
      {filterToDate && (
        <p className="caption">
          Сеансы на {anchor.getDate()} {MON_NOM[anchor.getMonth()].toLowerCase()} {anchor.getFullYear()} ·{' '}
          <Link href="/admin/calendar?view=list">показать все ближайшие</Link>
        </p>
      )}
      {events.length === 0 && <p className="caption">Сеансов не найдено. Создаются из «Календаря» или массового расписания.</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem', fontSize: 'var(--fs-small)' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--cream)' }}>
            <th>Дата и время</th><th>Программа</th><th>Продано</th><th>Свободно</th><th>Статус</th><th></th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} style={{ borderBottom: '1px solid var(--cream)' }}>
              <td>{e.startAt.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
              <td>{e.program.title}</td>
              <td>{e.booked}</td>
              <td>{freeSeats(e)}</td>
              <td><span className={`badge ${STATUS_BADGE[e.status] || ''}`}>{STATUS_RU[e.status] || e.status}</span></td>
              <td><Link href={`/admin/calendar/${e.id}`} className="btn btn--outline" style={{ padding: '0.3rem 0.7rem' }}>Открыть</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
