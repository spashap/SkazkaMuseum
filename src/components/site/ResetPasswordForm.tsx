'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResetPasswordForm({ token }: { token?: string }) {
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function requestLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMsg('');
    const fd = new FormData(e.currentTarget);
    await fetch('/api/account/request-password-reset', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fd.get('email') }),
    });
    setMsg('Если такой email зарегистрирован — на него отправлена ссылка для сброса пароля.');
    setBusy(false);
  }

  async function confirmReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMsg('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/account/reset-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: fd.get('newPassword') }),
    });
    if (res.ok) { setMsg('Пароль изменён — теперь можно войти.'); setTimeout(() => router.push('/account'), 1500); }
    else setMsg('Ссылка недействительна или истекла — запросите новую.');
    setBusy(false);
  }

  if (token) {
    return (
      <form onSubmit={confirmReset} className="form-card" style={{ maxWidth: 420 }}>
        <div className="form-group"><label>Новый пароль</label><input name="newPassword" type="password" required minLength={6} /></div>
        {msg && <p className="small" style={{ marginBottom: '1rem' }}>{msg}</p>}
        <button className="btn btn--primary" disabled={busy}>{busy ? 'Сохранение…' : 'Сохранить новый пароль'}</button>
      </form>
    );
  }

  return (
    <form onSubmit={requestLink} className="form-card" style={{ maxWidth: 420 }}>
      <div className="form-group"><label>Email</label><input name="email" type="email" required /></div>
      {msg && <p className="small" style={{ marginBottom: '1rem' }}>{msg}</p>}
      <button className="btn btn--primary" disabled={busy}>{busy ? 'Отправка…' : 'Отправить ссылку для сброса'}</button>
    </form>
  );
}
