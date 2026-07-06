'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useRef } from 'react';

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Все типы' },
  { value: 'excursion', label: 'Экскурсия' },
  { value: 'masterclass', label: 'Мастер-класс' },
  { value: 'quest', label: 'Квест' },
  { value: 'birthday', label: 'Праздник' },
  { value: 'free', label: 'Свободное посещение' },
  { value: 'show', label: 'Шоу' },
  { value: 'lecture', label: 'Лекторий' },
  { value: 'other', label: 'Другое' },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Все статусы' },
  { value: 'active', label: 'Активна' },
  { value: 'draft', label: 'Черновик' },
  { value: 'archived', label: 'В архиве' },
];

export default function ProgramFilters({ type, status, q }: { type: string; status: string; q: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  function push(next: { type?: string; status?: string; q?: string }) {
    const params = new URLSearchParams({ type, status, q, ...next });
    for (const key of Array.from(params.keys())) if (!params.get(key)) params.delete(key);
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  return (
    <div className="toolbar">
      <select value={type} onChange={(e) => push({ type: e.target.value })}>
        {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select value={status} onChange={(e) => push({ status: e.target.value })}>
        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <input
        defaultValue={q}
        placeholder="Поиск по названию…"
        onChange={(e) => {
          const value = e.target.value;
          clearTimeout(debounce.current);
          debounce.current = setTimeout(() => push({ q: value }), 300);
        }}
      />
    </div>
  );
}
