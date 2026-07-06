import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { randomToken, hoursFromNow } from '@/lib/accountTokens';
import { sendResetPasswordEmail } from '@/lib/accountEmail';
import { requestOrigin } from '@/lib/origin';

const Schema = z.object({ email: z.string().trim().toLowerCase().email() });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const origin = requestOrigin(req);

  const client = await db.client.findUnique({ where: { email: parsed.data.email } });
  if (client?.passwordHash) {
    const resetToken = randomToken();
    const resetTokenExpiresAt = hoursFromNow(0.5);
    const updated = await db.client.update({ where: { id: client.id }, data: { resetToken, resetTokenExpiresAt } });
    await sendResetPasswordEmail(updated, origin);
  }

  // Always the same response — don't reveal whether the account exists.
  return NextResponse.json({ ok: true });
}
