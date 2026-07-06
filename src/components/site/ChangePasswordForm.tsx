'use client';
import { useState } from 'react';

export default function ChangePasswordForm() {
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMsg('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/account/change-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: fd.get('currentPassword'), newPassword: fd.get('newPassword') }),
    });
    if (res.ok) { setMsg('Пароль изменён.'); e.currentTarget.reset(); }
    else {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error === 'wrong_password' ? 'Текущий пароль неверен.' : 'Не удалось изменить пароль.');
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="form-card" style={{ maxWidth: 480 }}>
      <div className="form-group"><label>Текущий пароль</label><input name="currentPassword" type="password" required /></div>
      <div className="form-group"><label>Новый пароль</label><input name="newPassword" type="password" required minLength={6} /></div>
      {msg && <p className="small" style={{ marginBottom: '1rem' }}>{msg}</p>}
      <button className="btn btn--primary" disabled={busy}>{busy ? 'Сохранение…' : 'Изменить пароль'}</button>
    </form>
  );
}
