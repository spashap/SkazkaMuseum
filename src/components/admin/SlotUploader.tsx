'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SlotUploader({ slotId }: { slotId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setMsg('');
    const fd = new FormData();
    fd.append('slotId', slotId);
    fd.append('file', file);
    const res = await fetch('/api/images/upload', { method: 'POST', body: fd });
    if (res.ok) { setMsg('Загружено'); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); setMsg(d.error || 'Ошибка'); }
    setBusy(false);
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={onFile} disabled={busy} />
      {msg && <span className="caption" style={{ marginLeft: '0.5rem' }}>{busy ? 'Обработка…' : msg}</span>}
    </div>
  );
}
