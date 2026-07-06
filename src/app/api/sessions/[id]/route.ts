import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serializeSession } from '@/lib/sessions';

// GET /api/sessions/[id] -> single session by id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await db.event.findUnique({ where: { id: params.id }, include: { program: true } });
  if (!session || session.status !== 'scheduled' || session.program.status !== 'active') {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json({ session: serializeSession(session) });
}
