import Link from 'next/link';
import { ticketQrDataUrl } from '@/lib/ticketQr';
import { ticketStatusLabel, type TicketDetail } from '@/lib/ticketDetail';
import { googleCalendarUrl, outlookCalendarUrl } from '@/lib/calendarLinks';
import EmailTicketButton from './EmailTicketButton';

// Reused by the dashboard preview, "Все билеты" and the standalone
// /account/ticket/[id] page — one place defines what a ticket looks like.
export default async function TicketCard({ t, origin, compact }: { t: TicketDetail; origin: string; compact?: boolean }) {
  const qr = await ticketQrDataUrl(t.id, origin);
  const status = ticketStatusLabel(t);
  const cancelled = t.status === 'cancelled' || t.event?.status === 'cancelled';

  return (
    <div className="program-card" style={{ flexDirection: 'row', gap: '1.25rem', alignItems: 'center', opacity: cancelled ? 0.65 : 1 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qr} alt="QR-код билета" width={80} height={80} style={{ borderRadius: 8, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
          <strong>{t.event?.program.title || 'Билет'}</strong>
          <span className="program-card__tag">{status}</span>
        </div>
        {t.event && (
          <p className="small" style={{ color: 'var(--text-light)', margin: '0.35rem 0' }}>
            {t.event.startAt.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })} ·{' '}
            {t.event.startAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}–
            {t.event.endAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
        <p className="small" style={{ color: 'var(--text-light)' }}>
          Билетов: {t.adults + t.children} · {t.amount ? `${t.amount} ₽` : 'по запросу'} · №{t.number}
        </p>
        {!compact && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center' }}>
            <Link href={`/account/ticket/${t.id}`} className="btn btn--outline-dark" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>Подробнее</Link>
            <a href={`/api/account/tickets/${t.id}/pdf`} className="btn btn--outline-dark" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>Скачать PDF</a>
            <EmailTicketButton id={t.id} />
            {t.event && (
              <>
                <a href={googleCalendarUrl({ title: t.event.program.title, description: `Заказ №${t.number}`, location: '', startAt: t.event.startAt, endAt: t.event.endAt })}
                  target="_blank" rel="noreferrer" className="btn btn--outline-dark" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>Google</a>
                <a href={outlookCalendarUrl({ title: t.event.program.title, description: `Заказ №${t.number}`, location: '', startAt: t.event.startAt, endAt: t.event.endAt })}
                  target="_blank" rel="noreferrer" className="btn btn--outline-dark" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>Outlook</a>
                <a href={`/api/account/tickets/${t.id}/ics`} className="btn btn--outline-dark" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>Apple (.ics)</a>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
