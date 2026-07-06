import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentClient } from '@/lib/customerAuth';

const Schema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(6) });

export async function POST(req: Request) {
  const client = await getCurrentClient();
  if (!client?.passwordHash) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const bcrypt = (await import('bcryptjs')).default;
  const ok = await bcrypt.compare(parsed.data.currentPassword, client.passwordHash);
  if (!ok) return NextResponse.json({ error: 'wrong_password' }, { status: 400 });

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db.client.update({ where: { id: client.id }, data: { passwordHash } });
  return NextResponse.json({ ok: true });
}
