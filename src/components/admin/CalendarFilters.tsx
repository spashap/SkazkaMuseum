'use client';

import { useRouter, usePathname } from 'next/navigation';

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

export default function CalendarFilters({ view, date, type }: { view: string; date: string; type: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function push(nextType: string) {
    const params = new URLSearchParams({ view, date, type: nextType });
    for (const key of Array.from(params.keys())) if (!params.get(key)) params.delete(key);
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  return (
    <select value={type} onChange={(e) => push(e.target.value)}>
      {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
