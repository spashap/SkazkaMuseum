'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LinkOrderForm() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMessage('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/account/link-order', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: fd.get('phone'), orderNumber: fd.get('orderNumber') }),
    });
    if (res.ok) { setMessage('Заказ присоединён к аккаунту.'); router.refresh(); }
    else setMessage('Заказ не найден, или он уже привязан к другому аккаунту.');
    setBusy(false);
  }

  if (!open) {
    return (
      <button type="button" className="btn btn--outline-dark" style={{ padding: '0.5rem 1.1rem' }} onClick={() => setOpen(true)}>
        Присоединить заказ, оформленный без входа
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="form-card" style={{ maxWidth: 420, padding: '1.5rem' }}>
      <p className="small" style={{ marginBottom: '1rem' }}>
        Введите телефон, указанный при заказе, и номер заказа (виден в подтверждении покупки).
      </p>
      <div className="form-group"><label>Телефон в заказе</label><input name="phone" type="tel" required /></div>
      <div className="form-group"><label>Номер заказа</label><input name="orderNumber" type="number" required /></div>
      {message && <p className="small" style={{ marginBottom: '0.75rem' }}>{message}</p>}
      <button className="btn btn--primary" disabled={busy}>{busy ? 'Проверка…' : 'Присоединить'}</button>
    </form>
  );
}
