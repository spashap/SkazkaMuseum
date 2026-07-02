import Link from 'next/link';
import { db } from '@/lib/db';

export default async function Footer() {
  const c = await db.companySettings.findUnique({ where: { id: 1 } });
  return (
    <footer style={{ background: 'var(--dark)', color: 'var(--cream)', padding: '2.5rem 0', marginTop: '2rem' }}>
      <div className="container" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: 'var(--fs-h3)', marginBottom: '0.5rem' }}>
            {c?.name || 'Музей русской сказки'}
          </div>
          <p className="small" style={{ color: 'var(--cream)' }}>{c?.address}</p>
          <p className="small" style={{ color: 'var(--cream)' }}>{c?.metro}</p>
        </div>
        <div className="small">
          <p><a href={`tel:${(c?.phone || '').replace(/[^+\d]/g, '')}`} style={{ color: 'var(--gold-light)' }}>{c?.phone}</a></p>
          <p><a href={`mailto:${c?.email}`} style={{ color: 'var(--gold-light)' }}>{c?.email}</a></p>
          <p><a href={c?.telegram} style={{ color: 'var(--gold-light)' }}>Telegram</a> · <a href={c?.maxLink} style={{ color: 'var(--gold-light)' }}>MAX</a></p>
        </div>
        <div className="small">
          <p><Link href="/privacy" style={{ color: 'var(--cream)' }}>Политика конфиденциальности</Link></p>
          <p><Link href="/consent" style={{ color: 'var(--cream)' }}>Согласие на обработку данных (152-ФЗ)</Link></p>
          <p><Link href="/offer" style={{ color: 'var(--cream)' }}>Публичная оферта</Link></p>
        </div>
      </div>
      <div className="container caption" style={{ color: 'var(--text-light)', marginTop: '1.5rem' }}>
        © {new Date().getFullYear()} {c?.name}
      </div>
    </footer>
  );
}
