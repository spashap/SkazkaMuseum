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
