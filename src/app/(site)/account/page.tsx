import Link from 'next/link';
import { db } from '@/lib/db';
import { getCurrentClient } from '@/lib/customerAuth';
import { requestOrigin } from '@/lib/origin';
import AccountNav from '@/components/site/AccountNav';
import AuthGate from '@/components/site/AuthGate';
import LinkOrderForm from '@/components/site/LinkOrderForm';
import TicketCard from '@/components/site/TicketCard';

export const metadata = { title: 'Личный кабинет' };

export default async function AccountHome() {
  const client = await getCurrentClient();

  if (!client) {
    return (
      <section className="section container" style={{ maxWidth: 480 }}>
        <div className="section__header text-center">
          <span className="eyebrow">Личный кабинет</span>
          <h1>Войти или создать аккаунт</h1>
        </div>
        <AuthGate />
      </section>
    );
  }

  const origin = requestOrigin();
  const now = new Date();

  const [nearest, activeBookings, promos] = await Promise.all([
    db.booking.findFirst({
      where: { clientId: client.id, status: { not: 'cancelled' }, event: { startAt: { gte: now }, status: 'scheduled' } },
      orderBy: { event: { startAt: 'asc' } },
      include: { event: { include: { program: true } }, client: true },
    }),
    db.booking.findMany({
      where: { clientId: client.id, status: { not: 'cancelled' }, event: { startAt: { gte: now } } },
      orderBy: { event: { startAt: 'asc' } },
      take: 3,
      include: { event: { include: { program: true } }, client: true },
    }),
    db.promo.findMany({ where: { clientId: client.id, active: true } }),
  ]);

  return (
    <section className="section container">
      <AccountNav active="/account" />
      <h1>Здравствуйте, {client.fullName}!</h1>

      {client.email && !client.emailVerifiedAt && (
        <p className="small" style={{ background: 'var(--cream)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', margin: '1rem 0' }}>
          Подтвердите email — мы отправили ссылку на {client.email}.
        </p>
      )}

      <div className="grid grid--2" style={{ marginTop: '1.5rem' }}>
        <div>
          <h2>Ближайшее мероприятие</h2>
          {nearest ? <TicketCard t={nearest} origin={origin} compact /> : <p className="caption">Пока нет предстоящих мероприятий.</p>}
        </div>
        <div>
          <h2>Бонусы</h2>
          <div className="program-card">
            <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--crimson)' }}>{client.bonusPoints} баллов</p>
            <p className="caption">Бонусная программа скоро заработает — баллы уже начнут копиться.</p>
          </div>
        </div>
      </div>

      <h2 style={{ marginTop: '2rem' }}>Активные билеты</h2>
      {activeBookings.length === 0 && <p className="caption">Активных билетов нет.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        {activeBookings.map((b) => <TicketCard key={b.id} t={b} origin={origin} compact />)}
      </div>
      {activeBookings.length > 0 && (
        <Link href="/account/tickets" className="btn btn--outline-dark" style={{ marginTop: '1rem' }}>Все билеты →</Link>
      )}

      <h2 style={{ marginTop: '2rem' }}>Персональные предложения</h2>
      {promos.length === 0 ? (
        <p className="caption">Персональных предложений пока нет.</p>
      ) : (
        <ul>{promos.map((p) => <li key={p.id}>{p.code} — {p.amount}{p.discountType === 'percent' ? '%' : ' ₽'}</li>)}</ul>
      )}

      <h2 style={{ marginTop: '2rem' }}>Заказ без регистрации?</h2>
      <LinkOrderForm />
    </section>
  );
}
