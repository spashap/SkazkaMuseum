import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import { ticketCount, ticketBreakdown } from '@/lib/ticketDetail';
import { undoCheckIn } from './actions';

export const dynamic = 'force-dynamic';

// Entry-control home (mobile-first — the cashier's phone). The primary flow is
// scanning a guest's QR with the phone camera (opens the ticket page with the
// check-in card); this page covers the rest: today's sessions with progress,
// manual lookup by order number, and undo for mistaken marks.
const fmtTime = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' });

// Moscow-day bounds computed via the same trick as the rest of the codebase:
// format "now" as a Moscow date, then take that calendar day.
function moscowDayBounds(): { from: Date; to: Date } {
  const key = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Moscow' }).format(new Date());
  const from = new Date(`${key}T00:00:00+03:00`);
  const to = new Date(`${key}T23:59:59.999+03:00`);
  return { from, to };
}

export default async function CheckinPage({ searchParams }: { searchParams?: { number?: string } }) {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'checkin')) redirect('/admin');

  // Manual lookup: typed order number → jump straight to the ticket page
  // (where the check-in card lives — one UI for scan and manual paths).
  let lookupError = '';
  const rawNumber = searchParams?.number?.trim();
  if (rawNumber) {
    const num = Number(rawNumber.replace(/^№/, ''));
    if (Number.isInteger(num) && num > 0) {
      const found = await db.booking.findUnique({ where: { number: num }, select: { id: true } });
      if (found) redirect(`/account/ticket/${found.id}`);
      lookupError = `Заказ №${num} не найден.`;
    } else {
      lookupError = 'Введите номер заказа цифрами, например 1001.';
    }
  }

  const { from, to } = moscowDayBounds();
  const [events, recent] = await Promise.all([
    db.event.findMany({
      where: { startAt: { gte: from, lte: to }, status: { not: 'cancelled' } },
      orderBy: { startAt: 'asc' },
      include: { program: true, bookings: { where: { status: { not: 'cancelled' } } } },
    }),
    db.booking.findMany({
      where: { usedAt: { not: null } },
      orderBy: { usedAt: 'desc' },
      take: 10,
      include: { event: { include: { program: true } } },
    }),
  ]);

  return (
    <>
      <h1>Контроль билетов</h1>
      <p className="caption">
        Основной способ: наведите камеру телефона на QR-код гостя — откроется билет с кнопкой «Пропустить».
        Здесь — поиск по номеру заказа и сеансы сегодняшнего дня.
      </p>

      <form method="get" className="toolbar" style={{ marginTop: '1rem' }}>
        <input
          type="text" name="number" inputMode="numeric" placeholder="Номер заказа, например 1001"
          autoFocus autoComplete="off" style={{ fontSize: '1.1rem' }}
        />
        <button type="submit" className="btn btn--primary">Найти</button>
      </form>
      {lookupError && <p className="small" style={{ color: 'var(--crimson)', marginTop: '0.5rem' }}>{lookupError}</p>}

      <h2 style={{ marginTop: '2rem' }}>Сеансы сегодня</h2>
      {events.length === 0 && <p className="caption">На сегодня сеансов нет.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {events.map((e) => {
          const seats = e.bookings.reduce((s, b) => s + ticketCount(b), 0);
          const inside = e.bookings.filter((b) => b.usedAt).reduce((s, b) => s + ticketCount(b), 0);
          const unpaidCount = e.bookings.filter((b) => b.status !== 'paid' && b.status !== 'completed').length;
          return (
            <div key={e.id} className="card"><div className="card__body" style={{ padding: '1rem' }}>
              <strong>{fmtTime.format(e.startAt)} — {e.program.title}</strong>
              <p className="small" style={{ marginBottom: 0 }}>
                Пропущено {inside} из {seats} чел. · заказов: {e.bookings.length}
                {unpaidCount > 0 && <span style={{ color: 'var(--crimson)' }}> · не оплачено: {unpaidCount}</span>}
              </p>
            </div></div>
          );
        })}
      </div>

      <h2 style={{ marginTop: '2rem' }}>Последние проходы</h2>
      {recent.length === 0 && <p className="caption">Пока никого не пропускали.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {recent.map((b) => (
          <div key={b.id} className="card"><div className="card__body" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <Link href={`/account/ticket/${b.id}`}><strong>№{b.number}</strong></Link> · {b.event?.program.title || '—'}
              <p className="caption" style={{ marginBottom: 0 }}>
                {b.usedAt && fmtTime.format(b.usedAt)} · {b.usedBy} · {ticketBreakdown(b)}
              </p>
            </div>
            <form action={undoCheckIn}>
              <input type="hidden" name="id" value={b.id} />
              <button type="submit" className="btn btn--outline-dark" style={{ padding: '0.4rem 0.9rem', fontSize: 'var(--fs-small)' }}>Вернуть</button>
            </form>
          </div></div>
        ))}
      </div>
    </>
  );
}
