import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

const Schema = z.object({ token: z.string().min(1), newPassword: z.string().min(6) });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const { token, newPassword } = parsed.data;

  const client = await db.client.findFirst({ where: { resetToken: token } });
  if (!client || !client.resetTokenExpiresAt || client.resetTokenExpiresAt < new Date()) {
    return NextResponse.json({ error: 'invalid_or_expired' }, { status: 400 });
  }

  const bcrypt = (await import('bcryptjs')).default;
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.client.update({
    where: { id: client.id },
    data: { passwordHash, resetToken: null, resetTokenExpiresAt: null },
  });

  return NextResponse.json({ ok: true });
}
