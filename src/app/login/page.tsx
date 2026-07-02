'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
    });
    if (res.ok) { router.push('/admin'); router.refresh(); }
    else { const d = await res.json(); setError(d.error || 'Ошибка входа'); setBusy(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dark)' }}>
      <form onSubmit={submit} className="card" style={{ width: 360 }}>
        <div className="card__body">
          <h2>Вход в личный кабинет</h2>
          <p className="caption">Музей русской сказки</p>
          <div className="field"><label>Email</label><input name="email" type="email" required autoFocus /></div>
          <div className="field"><label>Пароль</label><input name="password" type="password" required /></div>
          {error && <p className="small" style={{ color: 'var(--crimson)' }}>{error}</p>}
          <button className="btn" style={{ width: '100%' }} disabled={busy}>{busy ? 'Вход…' : 'Войти'}</button>
        </div>
      </form>
    </div>
  );
}
