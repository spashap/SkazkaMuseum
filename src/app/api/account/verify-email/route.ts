import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

const Schema = z.object({ token: z.string().min(1) });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const client = await db.client.findFirst({ where: { emailVerifyToken: parsed.data.token } });
  if (!client || !client.emailVerifyExpiresAt || client.emailVerifyExpiresAt < new Date()) {
    return NextResponse.json({ error: 'invalid_or_expired' }, { status: 400 });
  }

  await db.client.update({
    where: { id: client.id },
    data: { emailVerifiedAt: new Date(), emailVerifyToken: null, emailVerifyExpiresAt: null },
  });

  return NextResponse.json({ ok: true });
}
