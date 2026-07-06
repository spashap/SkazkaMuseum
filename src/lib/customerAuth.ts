import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { db } from './db';

// Customer-facing "личный кабинет" session — entirely separate from the staff
// session in src/lib/auth.ts (different cookie, different payload shape, never
// cross-checked), so admin auth/access is untouched by this module.
const COOKIE = 'customer_session';

const secret = () =>
  new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-insecure-secret-change-me');

export type CustomerSession = { cid: string };

export async function createCustomerSession(clientId: string) {
  const token = await new SignJWT({ cid: clientId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret());
  cookies().set(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', path: '/',
    secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { cid: payload.cid as string };
  } catch {
    return null;
  }
}

export function clearCustomerSession() {
  cookies().delete(COOKIE);
}

// Looked up fresh on every call (not cached) — cheap SQLite read, avoids serving
// stale account data after profile/password changes within the same request lifecycle.
export async function getCurrentClient() {
  const session = await getCustomerSession();
  if (!session) return null;
  return db.client.findUnique({ where: { id: session.cid } });
}
