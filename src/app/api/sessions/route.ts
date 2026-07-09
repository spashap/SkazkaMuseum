import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { publicSessionWhere, serializeSession } from '@/lib/sessions';

// GET /api/sessions
//   ?date=YYYY-MM-DD          -> sessions on that day (ticket page schedule panel)
//   ?year=YYYY&month=1-12     -> distinct dates in that month that have sessions (calendar dots)
//   ?upcoming=1&limit=N       -> nearest N upcoming sessions
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const year = searchParams.get('year');
  const month = searchParams.get('month');
  const upcoming = searchParams.get('upcoming');

  // Clamp every "from" to NOW — already-started sessions are not sellable.
  const now = new Date();

  if (date) {
    const from = new Date(`${date}T00:00:00`);
    if (isNaN(from.getTime())) return NextResponse.json({ error: 'invalid date' }, { status: 400 });
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    const sessions = await db.event.findMany({
      where: { ...publicSessionWhere(), startAt: { gte: from < now ? now : from, lt: to } },
      orderBy: { startAt: 'asc' },
      include: { program: true },
    });
    return NextResponse.json({ sessions: sessions.map(serializeSession) });
  }

  if (year && month) {
    const y = Number(year);
    const m = Number(month);
    if (!y || !m || m < 1 || m > 12) return NextResponse.json({ error: 'invalid year/month' }, { status: 400 });
    const from = new Date(y, m - 1, 1);
    const to = new Date(y, m, 1);
    const sessions = await db.event.findMany({
      where: { ...publicSessionWhere(), startAt: { gte: from < now ? now : from, lt: to } },
      select: { startAt: true },
    });
    const dates = Array.from(
      new Set(sessions.map((s) => s.startAt.toLocaleDateString('sv-SE'))) // sv-SE -> YYYY-MM-DD
    ).sort();
    return NextResponse.json({ dates });
  }

  if (upcoming) {
    const limit = Math.min(Number(searchParams.get('limit')) || 10, 50);
    const sessions = await db.event.findMany({
      where: publicSessionWhere(),
      orderBy: { startAt: 'asc' },
      take: limit,
      include: { program: true },
    });
    return NextResponse.json({ sessions: sessions.map(serializeSession) });
  }

  return NextResponse.json({ error: 'missing query: date, year+month, or upcoming' }, { status: 400 });
}
