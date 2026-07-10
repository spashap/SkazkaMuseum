'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';

// Sets/changes a client's email from the CRM list. Only for clients WITHOUT a
// personal account (passwordHash null) — for registered clients the email is
// their login and they manage it themselves in the личный кабинет; the page
// renders those read-only, and this guard is what actually enforces it.
export async function updateClientEmail(formData: FormData) {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'clients')) redirect('/admin');

  const id = String(formData.get('id') || '');
  const parsed = z.string().trim().toLowerCase().email().safeParse(formData.get('email'));
  if (!id || !parsed.success) return;

  const client = await db.client.findUnique({ where: { id } });
  if (!client || client.passwordHash) return;

  try {
    await db.client.update({ where: { id }, data: { email: parsed.data } });
  } catch {
    // Client.email is @unique — the address already belongs to another client.
    redirect('/admin/clients?err=email_taken');
  }
  revalidatePath('/admin/clients');
}
