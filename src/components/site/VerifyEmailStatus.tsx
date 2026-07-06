'use client';
import { useEffect, useState } from 'react';

export default function VerifyEmailStatus({ token }: { token?: string }) {
  const [msg, setMsg] = useState('Проверяем ссылку…');

  useEffect(() => {
    if (!token) { setMsg('Ссылка неполная — не найден токен подтверждения.'); return; }
    fetch('/api/account/verify-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then(async (res) => {
      setMsg(res.ok ? 'Email подтверждён, спасибо!' : 'Ссылка недействительна или истекла.');
    }).catch(() => setMsg('Не удалось проверить ссылку.'));
  }, [token]);

  return <p className="form-card" style={{ maxWidth: 420 }}>{msg}</p>;
}
