import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentClient } from '@/lib/customerAuth';
import { randomToken, hoursFromNow } from '@/lib/accountTokens';
import { sendVerifyEmail } from '@/lib/accountEmail';
import { requestOrigin } from '@/lib/origin';

const Schema = z.object({
  fullName: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(3).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
});

export async function POST(req: Request) {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const d = parsed.data;
  const origin = requestOrigin(req);

  const emailChanged = d.email !== undefined && d.email !== client.email;

  try {
    const updated = await db.client.update({
      where: { id: client.id },
      data: {
        ...(d.fullName !== undefined ? { fullName: d.fullName } : {}),
        ...(d.phone !== undefined ? { phone: d.phone } : {}),
        ...(emailChanged
          ? { email: d.email, emailVerifiedAt: null, emailVerifyToken: randomToken(), emailVerifyExpiresAt: hoursFromNow(24) }
          : {}),
      },
    });

    if (emailChanged) await sendVerifyEmail(updated, origin);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'phone_or_email_taken' }, { status: 409 });
  }
}
