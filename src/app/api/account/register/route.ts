import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createCustomerSession } from '@/lib/customerAuth';
import { randomToken, hoursFromNow } from '@/lib/accountTokens';
import { sendVerifyEmail } from '@/lib/accountEmail';
import { requestOrigin } from '@/lib/origin';

// Registration doesn't create a new "user" — it activates the existing Client row
// (the same one guest ticket orders upsert by phone), so any bookings already
// placed under that phone show up immediately once the account is claimed.
const Schema = z
  .object({
    phone: z.string().trim().min(3).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    fullName: z.string().trim().min(1),
    password: z.string().min(6),
  })
  .refine((v) => v.phone || v.email, { message: 'Укажите телефон или email' });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const d = parsed.data;
  const origin = requestOrigin(req);

  const existing = await db.client.findFirst({
    where: { OR: [...(d.phone ? [{ phone: d.phone }] : []), ...(d.email ? [{ email: d.email }] : [])] },
  });
  if (existing?.passwordHash) {
    return NextResponse.json({ error: 'already_registered' }, { status: 409 });
  }

  const bcrypt = (await import('bcryptjs')).default;
  const passwordHash = await bcrypt.hash(d.password, 10);
  const emailVerifyToken = d.email ? randomToken() : null;
  const emailVerifyExpiresAt = d.email ? hoursFromNow(24) : null;

  try {
    const client = existing
      ? await db.client.update({
          where: { id: existing.id },
          data: {
            fullName: d.fullName, passwordHash,
            phone: d.phone ?? existing.phone, email: d.email ?? existing.email,
            emailVerifyToken, emailVerifyExpiresAt,
          },
        })
      : await db.client.create({
          data: {
            fullName: d.fullName, phone: d.phone, email: d.email, passwordHash,
            emailVerifyToken, emailVerifyExpiresAt, source: 'account',
          },
        });

    if (client.email) await sendVerifyEmail(client, origin);
    await createCustomerSession(client.id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'phone_or_email_taken' }, { status: 409 });
  }
}
