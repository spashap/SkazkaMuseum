import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Promo() {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'promo')) redirect('/admin');
  const [promos, certs] = await Promise.all([
    db.promo.findMany({ orderBy: { id: 'desc' } }),
    db.certificate.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
  ]);
  return (
    <>
      <h1>Акции и промокоды</h1>
      <p className="caption">Создание промокодов и подарочных сертификатов (QR, PDF на email) — этап 7 (PLAN.md).</p>
      <h2 style={{ marginTop: '1rem' }}>Промокоды</h2>
      {promos.length === 0 ? <p className="caption">Пока нет промокодов.</p> : (
        <ul>{promos.map((p) => <li key={p.id} className="small">{p.code} — {p.discountType === 'percent' ? `${p.amount}%` : `${p.amount} ₽`} · использован {p.uses} раз</li>)}</ul>
      )}
      <h2 style={{ marginTop: '1rem' }}>Сертификаты</h2>
      {certs.length === 0 ? <p className="caption">Пока нет сертификатов.</p> : (
        <ul>{certs.map((c) => <li key={c.id} className="small">{c.number} — {c.amount} ₽ · {c.status}</li>)}</ul>
      )}
    </>
  );
}
