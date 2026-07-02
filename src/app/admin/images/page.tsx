import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SlotUploader from '@/components/admin/SlotUploader';

// Image slot manager. Each slot = a named place on the site with a recommended size.
// Every slot ships with her original image (seedPath); uploading replaces it (optimized).
export default async function Images() {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'images')) redirect('/admin');
  const slots = await db.imageSlot.findMany({ orderBy: { id: 'asc' } });

  return (
    <>
      <h1>Изображения сайта</h1>
      <p className="caption">Загрузите фото для нужного места. Соблюдайте рекомендуемый размер — так сайт остаётся лёгким и аккуратным. Пока фото не заменено, показывается оригинал.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
        {slots.map((s) => {
          const current = s.webpPath || s.seedPath;
          return (
            <div key={s.id} className="card"><div className="card__body" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: 120, flexShrink: 0 }}>
                {current
                  ? <img src={current} alt={s.alt} style={{ borderRadius: 'var(--radius)' }} />
                  : <div className="caption" style={{ padding: '1rem', border: '2px dashed var(--gold)', borderRadius: 'var(--radius)', textAlign: 'center' }}>нет фото</div>}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <strong>{s.label}</strong> {s.webpPath && <span className="caption">(заменено)</span>}<br />
                <span className="caption">ID: {s.id} · Рекомендуемый размер {s.recW}×{s.recH}px</span>
                <div style={{ marginTop: '0.5rem' }}><SlotUploader slotId={s.id} /></div>
              </div>
            </div></div>
          );
        })}
      </div>
    </>
  );
}
