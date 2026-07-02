'use client';
import { useState } from 'react';

// Online ticket purchase (spec 2.1). Calls /api/pay → YooKassa. Until keys are set
// in .env, the API returns "not configured" and we show a friendly message + the
// enquiry fallback. Wired end-to-end so it goes live the moment secrets are added.
const OPTIONS = [
  { id: 'adult', label: 'Взрослый билет', price: 800 },
  { id: 'child', label: 'Детский билет', price: 600 },
  { id: 'family', label: 'Семейный (2+2)', price: 2400 },
];

export default function TicketsWidget() {
  const [sel, setSel] = useState(OPTIONS[0]);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function pay() {
    setBusy(true); setMsg('');
    try {
      const res = await fetch('/api/pay', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: sel.label, amount: sel.price * qty }),
      });
      const data = await res.json();
      if (data.confirmationUrl) { window.location.href = data.confirmationUrl; return; }
      setMsg('Онлайн-оплата скоро будет доступна. Пожалуйста, забронируйте по телефону или в форме ниже.');
    } catch {
      setMsg('Не удалось начать оплату. Попробуйте позже.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <div className="card__body">
        <h2>Купить билет онлайн</h2>
        <div className="field">
          <label>Тип билета</label>
          <select value={sel.id} onChange={(e) => setSel(OPTIONS.find((o) => o.id === e.target.value)!)}>
            {OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label} — {o.price} ₽</option>)}
          </select>
        </div>
        <div className="field">
          <label>Количество</label>
          <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} />
        </div>
        <p><strong>Итого: {sel.price * qty} ₽</strong></p>
        <button className="btn" onClick={pay} disabled={busy}>{busy ? 'Переход к оплате…' : 'Оплатить'}</button>
        {msg && <p className="small" style={{ color: 'var(--crimson)', marginTop: '0.75rem' }}>{msg}</p>}
      </div>
    </div>
  );
}
