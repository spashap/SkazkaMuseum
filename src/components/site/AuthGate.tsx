'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: '0.6rem 0', fontWeight: 600, fontSize: '0.95rem', background: 'none', border: 'none', cursor: 'pointer',
    color: active ? 'var(--crimson)' : 'var(--text-light)',
    borderBottom: active ? '2px solid var(--crimson)' : '2px solid transparent',
  };
}

export default function AuthGate() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submitLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/account/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: fd.get('identifier'), password: fd.get('password') }),
    });
    if (res.ok) { router.refresh(); return; }
    setError('Неверный телефон/email или пароль');
    setBusy(false);
  }

  async function submitRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/account/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: fd.get('fullName'),
        phone: fd.get('phone') || undefined,
        email: fd.get('email') || undefined,
        password: fd.get('password'),
      }),
    });
    if (res.ok) { router.refresh(); return; }
    const d = await res.json().catch(() => ({}));
    setError(
      d.error === 'already_registered' ? 'Этот телефон или email уже зарегистрирован — войдите'
      : d.error === 'phone_or_email_taken' ? 'Телефон или email уже используется другим аккаунтом'
      : 'Укажите хотя бы телефон или email и пароль от 6 символов'
    );
    setBusy(false);
  }

  return (
    <div className="form-card">
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <button type="button" onClick={() => { setTab('login'); setError(''); }} style={tabStyle(tab === 'login')}>Войти</button>
        <button type="button" onClick={() => { setTab('register'); setError(''); }} style={tabStyle(tab === 'register')}>Регистрация</button>
      </div>

      {error && <p className="small" style={{ color: 'var(--crimson)', marginBottom: '1rem' }}>{error}</p>}

      {tab === 'login' ? (
        <form onSubmit={submitLogin}>
          <div className="form-group"><label>Телефон или email</label><input name="identifier" required autoFocus /></div>
          <div className="form-group"><label>Пароль</label><input name="password" type="password" required /></div>
          <button className="btn btn--primary" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
            {busy ? 'Вход…' : 'Войти'}
          </button>
          <p className="small" style={{ marginTop: '1rem', textAlign: 'center' }}>
            <a href="/account/reset-password" style={{ color: 'var(--gold-dark)' }}>Забыли пароль?</a>
          </p>
        </form>
      ) : (
        <form onSubmit={submitRegister}>
          <div className="form-group"><label>Имя *</label><input name="fullName" required /></div>
          <div className="form-group"><label>Телефон</label><input name="phone" type="tel" placeholder="+7 (___) ___-__-__" /></div>
          <div className="form-group"><label>Email</label><input name="email" type="email" /></div>
          <div className="form-group"><label>Пароль *</label><input name="password" type="password" required minLength={6} /></div>
          <p className="small" style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
            Укажите хотя бы одно — телефон или email. Если у вас уже есть заказ на этот телефон,
            все билеты появятся в кабинете сразу после регистрации.
          </p>
          <button className="btn btn--primary" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
            {busy ? 'Создание…' : 'Создать аккаунт'}
          </button>
        </form>
      )}
    </div>
  );
}
