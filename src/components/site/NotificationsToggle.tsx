'use client';
import { useState } from 'react';

export default function NotificationsToggle({ initial }: { initial: boolean }) {
  const [checked, setChecked] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !checked;
    setChecked(next); setBusy(true);
    await fetch('/api/account/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOptIn: next }),
    });
    setBusy(false);
  }

  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} disabled={busy} onChange={toggle} />
      Получать письма и напоминания на email
    </label>
  );
}
