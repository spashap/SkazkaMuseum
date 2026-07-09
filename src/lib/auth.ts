import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { db } from './db';

// Roles and what each may access. Keep this the single source of permission truth.
export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER';

// Which admin sections each role can open.
// CASHIER deliberately sees ONLY entry control (checkin) — no CRM, no finance,
// no revenue on the dashboard (see projectSpec/checkin-plan.md).
export const SECTION_ACCESS: Record<string, Role[]> = {
  dashboard: ['ADMIN', 'MANAGER'],
  checkin: ['ADMIN', 'MANAGER', 'CASHIER'], // entry control: scan/validate tickets at the door
  zayavki: ['ADMIN', 'MANAGER'],
  bookings: ['ADMIN', 'MANAGER'],
  clients: ['ADMIN', 'MANAGER'],
  calendar: ['ADMIN', 'MANAGER'],
  programs: ['ADMIN', 'MANAGER'],
  finance: ['ADMIN'],
  analytics: ['ADMIN'],
  promo: ['ADMIN', 'MANAGER'],
  users: ['ADMIN'],
  design: ['ADMIN'],
  images: ['ADMIN', 'MANAGER'],
  settings: ['ADMIN'],
};

export function canAccess(role: Role, section: string): boolean {
  return SECTION_ACCESS[section]?.includes(role) ?? false;
}

const secret = () =>
  new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-insecure-secret-change-me');

export type Session = { uid: string; role: Role; name: string };

export async function createSession(s: Session) {
  const token = await new SignJWT(s)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
  cookies().set('session', token, {
    httpOnly: true, sameSite: 'lax', path: '/',
    secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get('session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { uid: payload.uid as string, role: payload.role as Role, name: payload.name as string };
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().delete('session');
}

export async function verifyLogin(email: string, password: string): Promise<Session | null> {
  const bcrypt = (await import('bcryptjs')).default;
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.status !== 'active') return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return { uid: user.id, role: user.role as Role, name: user.fullName };
}
