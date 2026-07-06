'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useRef } from 'react';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Все статусы' },
  { value: 'new', label: 'Новая' },
  { value: 'confirmed', label: 'Подтверждена' },
  { value: 'paid', label: 'Оплачена' },
  { value: 'completed', label: 'Завершена' },
  { value: 'cancelled', label: 'Отменена' },
];

export default function OrdersFilters({ status, q }: { status: string; q: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  function push(next: { status?: string; q?: string }) {
    const params = new URLSearchParams({ status, q, ...next });
    for (const key of Array.from(params.keys())) if (!params.get(key)) params.delete(key);
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  return (
    <div className="toolbar">
      <select value={status} onChange={(e) => push({ status: e.target.value })}>
        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <input
        defaultValue={q}
        placeholder="Поиск по номеру заказа или мероприятию…"
        onChange={(e) => {
          const value = e.target.value;
          clearTimeout(debounce.current);
          debounce.current = setTimeout(() => push({ q: value }), 300);
        }}
      />
    </div>
  );
}
