'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Custom confirm dialog (not window.confirm — that can't show custom button labels)
// backed by DELETE /api/admin/programs/[id]. Shows the server's "can't delete, still
// in use" message inline instead of failing silently.
export default function DeleteProgramButton({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function confirmDelete() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/programs/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(data.message || 'Не удалось удалить программу.');
      }
    } catch {
      setError('Ошибка сети. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="btn btn--outline" style={{ padding: '0.4rem 0.9rem' }} onClick={() => setOpen(true)}>
        Удалить
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
          onClick={() => !busy && setOpen(false)}
        >
          <div
            style={{ background: 'var(--white)', borderRadius: 'var(--radius)', padding: '1.5rem', maxWidth: 400, boxShadow: 'var(--shadow-lg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ marginBottom: error ? '0.75rem' : '1.25rem' }}>
              Вы действительно хотите удалить программу «{title}»? Это действие нельзя отменить.
            </p>
            {error && <p className="small" style={{ color: 'var(--crimson)', marginBottom: '1.25rem' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn--outline" onClick={() => setOpen(false)} disabled={busy}>Отмена</button>
              <button type="button" className="btn" onClick={confirmDelete} disabled={busy}>{busy ? 'Удаление…' : 'Удалить'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
