import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Finance() {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'finance')) redirect('/admin');
  const [agg, txs] = await Promise.all([
    db.transaction.aggregate({ _sum: { amount: true }, _count: true, where: { status: 'completed' } }),
    db.transaction.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { booking: { include: { client: true } } } }),
  ]);
  const avg = agg._count ? Math.round((agg._sum.amount || 0) / agg._count) : 0;
  return (
    <>
      <h1>Финансы</h1>
      <div className="grid grid--3" style={{ marginTop: '1rem' }}>
        <div className="card"><div className="card__body"><div className="caption">Общая выручка</div><div style={{ fontSize: 'var(--fs-h2)', fontWeight: 700 }}>{(agg._sum.amount || 0).toLocaleString('ru-RU')} ₽</div></div></div>
        <div className="card"><div className="card__body"><div className="caption">Транзакций</div><div style={{ fontSize: 'var(--fs-h2)', fontWeight: 700 }}>{agg._count}</div></div></div>
        <div className="card"><div className="card__body"><div className="caption">Средний чек</div><div style={{ fontSize: 'var(--fs-h2)', fontWeight: 700 }}>{avg.toLocaleString('ru-RU')} ₽</div></div></div>
      </div>
      <p className="caption" style={{ marginTop: '1rem' }}>Разбивка по программам и способам оплаты, экспорт в Excel — этап 7 (PLAN.md).</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: 'var(--fs-small)' }}>
        <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid var(--cream)' }}><th>Дата</th><th>Клиент</th><th>Сумма</th><th>Способ</th></tr></thead>
        <tbody>
          {txs.map((t) => (
            <tr key={t.id} style={{ borderBottom: '1px solid var(--cream)' }}>
              <td>{new Date(t.createdAt).toLocaleDateString('ru-RU')}</td>
              <td>{t.booking?.client?.fullName || '—'}</td>
              <td>{t.amount} ₽</td>
              <td>{t.method}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
