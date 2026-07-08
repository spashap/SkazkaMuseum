import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';

const BLOCKED_MESSAGE =
  'Эту программу нельзя удалить, так как она используется в мероприятиях или содержит историю продаж. ' +
  'Сначала удалите связанные мероприятия или используйте архивирование.';

// Deletes a Program only when it's safe: no scheduled sessions (Event) and no bookings
// (Booking covers reservations, sold tickets, orders and sales history — there's no
// separate "order"/"ticket" table in this schema). Count check + delete run in one
// transaction so a concurrent booking can't sneak in between the check and the delete.
// (Certificate.programId is a plain string field, not a real FK, and nothing in the
// codebase ever creates a Certificate row today — see CLAUDE.md phase notes — so it's
// intentionally not checked here; revisit if that feature is ever wired up.)
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'programs')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const id = params.id;

  try {
    await db.$transaction(async (tx) => {
      const program = await tx.program.findUnique({ where: { id } });
      if (!program) throw new Error('NOT_FOUND');

      const [eventCount, bookingCount] = await Promise.all([
        tx.event.count({ where: { programId: id } }),
        tx.booking.count({ where: { programId: id } }),
      ]);
      if (eventCount > 0 || bookingCount > 0) throw new Error('HAS_DEPENDENCIES');

      await tx.upsell.deleteMany({ where: { programId: id } });
      await tx.program.delete({ where: { id } });
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    if (e instanceof Error && e.message === 'HAS_DEPENDENCIES') {
      return NextResponse.json({ error: 'has_dependencies', message: BLOCKED_MESSAGE }, { status: 409 });
    }
    throw e;
  }

  revalidatePath('/admin/programs');
  return NextResponse.json({ ok: true });
}
