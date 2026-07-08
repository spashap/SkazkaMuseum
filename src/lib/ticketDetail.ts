import { db } from './db';

// Shared by the ticket detail page and the PDF/ICS/email endpoints so the same
// Booking→Event→Program shape isn't re-declared in five different places.
export async function getTicketDetail(bookingId: string) {
  return db.booking.findUnique({
    where: { id: bookingId },
    include: { event: { include: { program: true } }, client: true },
  });
}

export type TicketDetail = NonNullable<Awaited<ReturnType<typeof getTicketDetail>>>;

const STATUS_RU: Record<string, string> = {
  new: 'Новая', confirmed: 'Подтверждена', paid: 'Оплачена', completed: 'Завершена', cancelled: 'Отменена',
};

export function ticketStatusLabel(t: TicketDetail): string {
  if (t.event?.status === 'cancelled') return 'Мероприятие отменено';
  if (t.status === 'cancelled') return 'Заказ отменён';
  const base = STATUS_RU[t.status] || t.status;
  return t.event?.rescheduledAt ? `${base} · перенесено` : base;
}

type TicketCounts = { adults: number; children: number; reduced: number; reducedCategory: string };

// Total seats held by a booking — the one place this sum is computed, reused by seat
// release math, PDFs, emails, and every ticket-count display so a new rate (a future
// third/fourth bucket) only needs to be added here.
export function ticketCount(t: TicketCounts): number {
  return t.adults + t.children + t.reduced;
}

// Human-readable per-rate breakdown, e.g. "Взрослых: 2 · Детских: 1 · Льготных: 1 (Пенсионеры)".
export function ticketBreakdown(t: TicketCounts): string {
  const parts: string[] = [];
  if (t.adults > 0) parts.push(`Взрослых: ${t.adults}`);
  if (t.children > 0) parts.push(`Детских: ${t.children}`);
  if (t.reduced > 0) parts.push(`Льготных: ${t.reduced}${t.reducedCategory ? ` (${t.reducedCategory})` : ''}`);
  return parts.join(' · ');
}
