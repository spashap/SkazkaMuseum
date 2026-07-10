import { type TicketDetail, ticketBreakdown, hasReducedTickets } from '@/lib/ticketDetail';
import { checkInBooking, undoCheckIn, acceptCashPayment } from '@/app/admin/checkin/actions';

// Entry-control card («светофор») shown ABOVE the client ticket view when the
// viewer is staff with 'checkin' access. The cashier scans the guest's QR with
// a plain phone camera → this page opens in their logged-in mobile browser →
// one big thumb-sized button. See projectSpec/checkin-plan.md.

const fmtTime = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' });
const fmtDay = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Moscow' });
const dayKeyFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Moscow' });

const BIG_BTN = { width: '100%', justifyContent: 'center', fontSize: '1.1rem', padding: '1rem' } as const;

function Verdict({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ borderLeft: `6px solid ${color}`, paddingLeft: '0.75rem', marginBottom: '1rem' }}>
      {children}
    </div>
  );
}

export default function CheckinPanel({ t, staffName }: { t: TicketDetail; staffName: string }) {
  const eventCancelled = t.event?.status === 'cancelled';
  const cancelled = t.status === 'cancelled' || eventCancelled;
  const paid = t.status === 'paid' || t.status === 'completed';
  const notToday = t.event ? dayKeyFmt.format(t.event.startAt) !== dayKeyFmt.format(new Date()) : false;

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card__body">
        <p className="caption" style={{ marginBottom: '0.5rem' }}>Контроль входа · вы вошли как {staffName}</p>
        <h3 style={{ marginBottom: '0.25rem' }}>{t.event?.program.title || 'Без программы'}</h3>
        {t.event && (
          <p style={{ marginBottom: '0.75rem' }}>
            Сеанс: <strong>{fmtDay.format(t.event.startAt)}, {fmtTime.format(t.event.startAt)}</strong>
            {notToday && <span style={{ color: 'var(--crimson)', fontWeight: 'var(--fw-bold)' as never }}> — НЕ СЕГОДНЯ!</span>}
          </p>
        )}
        <p style={{ marginBottom: '0.25rem' }}><strong>{ticketBreakdown(t) || 'состав не указан'}</strong></p>
        <p className="small" style={{ marginBottom: '0.75rem' }}>
          {t.client?.fullName || '—'} · {t.client?.phone || 'без телефона'} · {t.buyerEmail || t.client?.email || 'без email'} · {t.amount} ₽ · заказ №{t.number}
        </p>
        {hasReducedTickets(t) && (
          <p className="small" style={{ color: 'var(--crimson)', marginBottom: '0.75rem' }}>
            ⚠ Льготные билеты — проверьте подтверждающий документ ({[t.reducedCategory, t.reducedChildCategory].filter(Boolean).join(', ')})
          </p>
        )}

        {cancelled ? (
          <Verdict color="var(--crimson)">
            <p style={{ fontWeight: 'var(--fw-bold)' as never, color: 'var(--crimson)', marginBottom: 0 }}>
              🔴 {eventCancelled ? 'Сеанс отменён' : 'Заказ отменён'} — не пропускать
            </p>
          </Verdict>
        ) : t.usedAt ? (
          <>
            <Verdict color="var(--crimson)">
              <p style={{ fontWeight: 'var(--fw-bold)' as never, color: 'var(--crimson)', marginBottom: 0 }}>
                🔴 Уже использован — {fmtDay.format(t.usedAt)}, {fmtTime.format(t.usedAt)} ({t.usedBy || 'сотрудник'})
              </p>
            </Verdict>
            <form action={undoCheckIn}>
              <input type="hidden" name="id" value={t.id} />
              <button type="submit" className="btn btn--outline-dark" style={{ width: '100%', justifyContent: 'center' }}>
                Вернуть (отметка ошибочна)
              </button>
            </form>
          </>
        ) : paid ? (
          <>
            <Verdict color="var(--forest)">
              <p style={{ fontWeight: 'var(--fw-bold)' as never, color: 'var(--forest)', marginBottom: 0 }}>🟢 Оплачен, не использован</p>
            </Verdict>
            <form action={checkInBooking}>
              <input type="hidden" name="id" value={t.id} />
              <button type="submit" className="btn btn--primary" style={BIG_BTN}>Пропустить группу ✓</button>
            </form>
          </>
        ) : (
          <>
            <Verdict color="var(--gold)">
              <p style={{ fontWeight: 'var(--fw-bold)' as never, marginBottom: 0 }}>🟡 Не оплачен — к оплате {t.amount} ₽</p>
            </Verdict>
            <form action={acceptCashPayment}>
              <input type="hidden" name="id" value={t.id} />
              <button type="submit" className="btn btn--primary" style={BIG_BTN}>Принять оплату на кассе ({t.amount} ₽)</button>
            </form>
            <p className="caption" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
              После приёма оплаты появится кнопка «Пропустить».
            </p>
          </>
        )}
      </div>
    </div>
  );
}
