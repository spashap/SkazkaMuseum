import type { Event, Prisma, Program } from '@prisma/client';

// Shared helpers for the Program → Event ("Сеанс") → public schedule pipeline.
// Reused by admin/calendar actions and the public /api/sessions* routes so seat
// math and the public JSON shape live in exactly one place.

export type SessionWithProgram = Event & { program: Program };

export function freeSeats(e: Pick<Event, 'capacity' | 'booked'>): number {
  return Math.max(0, e.capacity - e.booked);
}

export function isSoldOut(e: Pick<Event, 'capacity' | 'booked'>): boolean {
  return freeSeats(e) <= 0;
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// What the public site is allowed to see: scheduled (not cancelled/hidden)
// sessions of active programs, from a given moment forward.
export function publicSessionWhere(from: Date = startOfToday()): Prisma.EventWhereInput {
  return {
    status: 'scheduled',
    startAt: { gte: from },
    program: { status: 'active' },
  };
}

export function serializeSession(e: SessionWithProgram) {
  return {
    id: e.id,
    programId: e.programId,
    title: e.program.title,
    type: e.program.type,
    startAt: e.startAt.toISOString(),
    endAt: e.endAt.toISOString(),
    ageLimit: e.program.ageLimit,
    durationMin: e.program.durationMin,
    priceAdult: e.program.priceAdult,
    priceChild: e.program.priceChild,
    shortDesc: e.program.shortDesc,
    capacity: e.capacity,
    booked: e.booked,
    free: freeSeats(e),
    sold: isSoldOut(e),
  };
}
