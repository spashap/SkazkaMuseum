import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentClient } from '@/lib/customerAuth';

const Schema = z.object({ emailOptIn: z.boolean() });

export async function POST(req: Request) {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  await db.client.update({ where: { id: client.id }, data: { emailOptIn: parsed.data.emailOptIn } });
  return NextResponse.json({ ok: true });
}
