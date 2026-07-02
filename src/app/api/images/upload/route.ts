import { NextResponse } from 'next/server';
import { getSession, canAccess } from '@/lib/auth';
import { processAndStore } from '@/lib/images';

// Admin image upload for a slot → sharp optimization. Guarded by session + role.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'images'))
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const form = await req.formData();
  const slotId = String(form.get('slotId') || '');
  const file = form.get('file') as File | null;
  if (!slotId || !file) return NextResponse.json({ error: 'missing' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const out = await processAndStore(slotId, buffer);
    return NextResponse.json({ ok: true, ...out });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
