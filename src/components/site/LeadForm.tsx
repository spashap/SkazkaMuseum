'use client';
import { useState } from 'react';

// Site booking/enquiry form. POSTs to /api/leads → lands in admin "Заявки".
// `source` = page id it was submitted from (spec 2.2). `type` = lead category.
export default function LeadForm({ source, type, program }: { source: string; type: string; program?: string }) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError('');
    const fd = new FormData(e.currentTarget);
    const payload = {
      type, source,
      name: String(fd.get('name') || ''),
      phone: String(fd.get('phone') || ''),
      email: String(fd.get('email') || ''),
      program: program || String(fd.get('program') || ''),
      date: String(fd.get('date') || ''),
      count: Number(fd.get('count') || 0),
      comment: String(fd.get('comment') || ''),
    };
    try {
      const res = await fetch('/api/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError('Не удалось отправить заявку. Позвоните нам, пожалуйста.');
    } finally {
      setBusy(false);
    }
  }

  if (sent)
    return (
      <div className="card"><div className="card__body">
        <h3>Спасибо! Заявка отправлена.</h3>
        <p>Менеджер свяжется с вами в ближайшее время.</p>
      </div></div>
    );

  return (
    <form onSubmit={submit} className="card" style={{ maxWidth: 520 }}>
      <div className="card__body">
        <h3>Оставить заявку</h3>
        <div className="field"><label>Имя *</label><input name="name" required /></div>
        <div className="field"><label>Телефон *</label><input name="phone" required placeholder="+7 ..." /></div>
        <div className="field"><label>Email</label><input name="email" type="email" /></div>
        {!program && <div className="field"><label>Программа</label><input name="program" /></div>}
        <div className="field"><label>Дата</label><input name="date" type="date" /></div>
        <div className="field"><label>Количество человек</label><input name="count" type="number" min={1} /></div>
        <div className="field"><label>Комментарий</label><textarea name="comment" rows={3} /></div>
        {error && <p className="small" style={{ color: 'var(--crimson)' }}>{error}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Отправка…' : 'Отправить заявку'}</button>
      </div>
    </form>
  );
}
