import { NextResponse } from 'next/server';
import { verifyLogin, createSession } from '@/lib/auth';

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  const session = await verifyLogin(String(email || ''), String(password || ''));
  if (!session) return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });
  await createSession(session);
  return NextResponse.json({ ok: true });
}
