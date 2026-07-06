'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Client } from '@prisma/client';

export default function ProfileForm({ client }: { client: Client }) {
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMsg('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/account/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: fd.get('fullName'), phone: fd.get('phone') || undefined, email: fd.get('email') || undefined }),
    });
    if (res.ok) { setMsg('Сохранено.'); router.refresh(); }
    else {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error === 'phone_or_email_taken' ? 'Телефон или email уже используется другим аккаунтом.' : 'Не удалось сохранить.');
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="form-card" style={{ maxWidth: 480 }}>
      <div className="form-group"><label>Имя</label><input name="fullName" defaultValue={client.fullName} required /></div>
      <div className="form-group"><label>Телефон</label><input name="phone" type="tel" defaultValue={client.phone ?? ''} /></div>
      <div className="form-group"><label>Email</label><input name="email" type="email" defaultValue={client.email ?? ''} /></div>
      {msg && <p className="small" style={{ marginBottom: '1rem' }}>{msg}</p>}
      <button className="btn btn--primary" disabled={busy}>{busy ? 'Сохранение…' : 'Сохранить'}</button>
    </form>
  );
}
