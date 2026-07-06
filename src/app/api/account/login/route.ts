import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createCustomerSession } from '@/lib/customerAuth';

const Schema = z.object({ identifier: z.string().trim().min(1), password: z.string().min(1) });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const { identifier, password } = parsed.data;
  const idLower = identifier.toLowerCase();

  const client = await db.client.findFirst({ where: { OR: [{ phone: identifier }, { email: idLower }] } });
  if (!client?.passwordHash) {
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
  }

  const bcrypt = (await import('bcryptjs')).default;
  const ok = await bcrypt.compare(password, client.passwordHash);
  if (!ok) return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });

  await createCustomerSession(client.id);
  return NextResponse.json({ ok: true });
}
