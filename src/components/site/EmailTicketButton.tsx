'use client';
import { useState } from 'react';

// Defaults to the logged-in account's own email; if there's no session (used
// from the public bearer /account/ticket/[id] page too), the server responds
// `no_email` and this reveals an inline field to send a copy elsewhere.
export default function EmailTicketButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [needEmail, setNeedEmail] = useState(false);
  const [email, setEmail] = useState('');

  async function send(withEmail?: string) {
    setBusy(true); setMsg('');
    const res = await fetch(`/api/account/tickets/${id}/email`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withEmail ? { email: withEmail } : {}),
    });
    if (res.ok) { setMsg('Отправлено'); setNeedEmail(false); }
    else {
      const d = await res.json().catch(() => ({}));
      if (d.error === 'no_email') setNeedEmail(true);
      else setMsg('Не удалось отправить');
    }
    setBusy(false);
  }

  if (needEmail) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
        <input
          type="email" placeholder="Ваш email" value={email} onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', borderRadius: 8, border: '1.5px solid rgba(0,0,0,0.12)' }}
        />
        <button type="button" className="btn btn--outline-dark" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
          onClick={() => send(email)} disabled={busy || !email}>
          {busy ? '…' : 'Отправить'}
        </button>
      </span>
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
      <button type="button" className="btn btn--outline-dark" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
        onClick={() => send()} disabled={busy}>
        {busy ? 'Отправка…' : 'Отправить на email'}
      </button>
      {msg && <span className="caption">{msg}</span>}
    </span>
  );
}
