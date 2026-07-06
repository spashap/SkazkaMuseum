'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import { SESSION_STATUSES } from './constants';

const SessionSchema = z.object({
  programId: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().trim(),
  capacity: z.coerce.number().int().min(1),
  status: z.enum(SESSION_STATUSES),
});

async function requireAccess() {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'calendar')) redirect('/admin');
  return session;
}

function combine(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseSessionForm(formData: FormData) {
  return SessionSchema.parse({
    programId: formData.get('programId') || '',
    date: formData.get('date') || '',
    startTime: formData.get('startTime') || '',
    endTime: formData.get('endTime') || '',
    capacity: formData.get('capacity') || 30,
    status: formData.get('status') || 'scheduled',
  });
}

export async function createSession(formData: FormData) {
  await requireAccess();
  const fields = parseSessionForm(formData);
  const program = await db.program.findUnique({ where: { id: fields.programId } });
  if (!program) redirect('/admin/calendar');

  const startAt = combine(fields.date, fields.startTime);
  const endAt = fields.endTime ? combine(fields.date, fields.endTime) : new Date(startAt.getTime() + program!.durationMin * 60000);

  await db.event.create({
    data: { programId: fields.programId, startAt, endAt, capacity: fields.capacity, status: fields.status },
  });

  revalidatePath('/admin/calendar');
  redirect('/admin/calendar');
}

export async function updateSession(formData: FormData) {
  await requireAccess();
  const id = String(formData.get('id') || '');
  const existing = await db.event.findUnique({ where: { id } });
  if (!existing) redirect('/admin/calendar');

  const fields = parseSessionForm(formData);
  const program = await db.program.findUnique({ where: { id: fields.programId } });
  const startAt = combine(fields.date, fields.startTime);
  const endAt = fields.endTime ? combine(fields.date, fields.endTime) : new Date(startAt.getTime() + (program?.durationMin ?? 60) * 60000);

  // Records that this session's time changed so the customer's личный кабинет can
  // honestly show "Перенесено" instead of silently showing the new time.
  const rescheduledAt = startAt.getTime() !== existing.startAt.getTime() ? new Date() : existing.rescheduledAt;

  await db.event.update({
    where: { id },
    data: { programId: fields.programId, startAt, endAt, capacity: fields.capacity, status: fields.status, rescheduledAt },
  });

  revalidatePath('/admin/calendar');
  redirect('/admin/calendar');
}

export async function deleteSession(formData: FormData) {
  await requireAccess();
  const id = String(formData.get('id') || '');
  try {
    await db.event.delete({ where: { id } });
  } catch {
    // Session still has bookings referencing it — cancel instead of losing that history.
    await db.event.update({ where: { id }, data: { status: 'cancelled' } }).catch(() => {});
  }
  revalidatePath('/admin/calendar');
}

export async function cancelSession(formData: FormData) {
  await requireAccess();
  const id = String(formData.get('id') || '');
  await db.event.update({ where: { id }, data: { status: 'cancelled' } });
  revalidatePath('/admin/calendar');
}

export async function toggleHideSession(formData: FormData) {
  await requireAccess();
  const id = String(formData.get('id') || '');
  const existing = await db.event.findUnique({ where: { id } });
  if (!existing) return;
  await db.event.update({ where: { id }, data: { status: existing.status === 'hidden' ? 'scheduled' : 'hidden' } });
  revalidatePath('/admin/calendar');
}

const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

const BulkSchema = z.object({
  programId: z.string().min(1),
  weekdays: z.array(z.coerce.number().int().min(0).max(6)).min(1),
  times: z.array(z.string().regex(TIME_RE)).min(1),
  dateFrom: z.string().min(1),
  dateTo: z.string().min(1),
  capacity: z.coerce.number().int().min(1),
});

function parseTimes(raw: string): string[] {
  return Array.from(new Set(raw.split(/[\s,;]+/).map((t) => t.trim()).filter((t) => TIME_RE.test(t))));
}

// Expands a recurrence rule (weekdays × times × date range) into concrete Event
// rows tagged with one seriesId. Idempotent: rows that already exist for this
// program+time are skipped, so re-running the same rule is safe.
export async function bulkCreateSessions(formData: FormData) {
  await requireAccess();
  const fields = BulkSchema.parse({
    programId: formData.get('programId') || '',
    weekdays: formData.getAll('weekdays'),
    times: parseTimes(String(formData.get('times') || '')),
    dateFrom: formData.get('dateFrom') || '',
    dateTo: formData.get('dateTo') || '',
    capacity: formData.get('capacity') || 30,
  });

  const program = await db.program.findUnique({ where: { id: fields.programId } });
  if (!program) redirect('/admin/calendar');

  const from = new Date(`${fields.dateFrom}T00:00:00`);
  const toExclusive = new Date(`${fields.dateTo}T00:00:00`);
  toExclusive.setDate(toExclusive.getDate() + 1);
  if (toExclusive <= from) redirect('/admin/calendar/bulk');

  const weekdaySet = new Set(fields.weekdays);
  const existingRows = await db.event.findMany({
    where: { programId: fields.programId, startAt: { gte: from, lt: toExclusive } },
    select: { startAt: true },
  });
  const existingTimes = new Set(existingRows.map((r) => r.startAt.getTime()));

  const seriesId = `series_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const rows: { programId: string; startAt: Date; endAt: Date; capacity: number; seriesId: string }[] = [];
  for (const d = new Date(from); d < toExclusive; d.setDate(d.getDate() + 1)) {
    if (!weekdaySet.has(d.getDay())) continue;
    for (const t of fields.times) {
      const startAt = combine(dateKey(d), t);
      if (existingTimes.has(startAt.getTime())) continue;
      const endAt = new Date(startAt.getTime() + program!.durationMin * 60000);
      rows.push({ programId: fields.programId, startAt, endAt, capacity: fields.capacity, seriesId });
    }
  }

  if (rows.length > 0) await db.event.createMany({ data: rows });

  revalidatePath('/admin/calendar');
  redirect('/admin/calendar');
}
