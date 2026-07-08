// Canonical program-type taxonomy — the single source for every place that lists or
// labels program types: the admin "Тип программы" dropdown, the programs/calendar list
// filters, Zod validation (see admin/programs/actions.ts), and the public /tickets filter
// panel (via TICKET_TYPE_FILTERS below, spliced in by src/lib/fragments.ts).
//
// `value` is stored in Program.type and read by filtering logic across the calendar,
// /api/sessions and public/site-runtime.js — never rename a `value`, only its `label`.
export const PROGRAM_TYPES = ['excursion', 'masterclass', 'quest', 'birthday', 'free', 'show', 'lecture'] as const;
export type ProgramTypeValue = (typeof PROGRAM_TYPES)[number];

export const PROGRAM_TYPE_LABELS: Record<ProgramTypeValue, string> = {
  excursion: 'Экскурсия',
  masterclass: 'Мастер-класс',
  quest: 'Квест',
  birthday: 'Праздник',
  free: 'Свободное посещение',
  show: 'Театр',
  lecture: 'Лекции',
};

export function programTypeLabel(value: string): string {
  return (PROGRAM_TYPE_LABELS as Record<string, string>)[value] ?? value;
}

export const PROGRAM_STATUSES = ['active', 'draft', 'archived'] as const;

// The /tickets page filter panel — a curated subset/order of the taxonomy above, with a
// couple of page-specific wording choices that predate this file (plural chip labels,
// "Вход" for general admission, and the `workshop` filter value that
// public/site-runtime.js already maps to `masterclass`). Labels for show/lecture are NOT
// re-typed here — they read straight from PROGRAM_TYPE_LABELS so a rename above is the
// only edit this ever needs.
export const TICKET_TYPE_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'free', label: 'Вход' },
  { value: 'excursion', label: 'Экскурсии' },
  { value: 'quest', label: 'Квесты' },
  { value: 'show', label: PROGRAM_TYPE_LABELS.show },
  { value: 'workshop', label: 'Мастер-классы' },
  { value: 'lecture', label: PROGRAM_TYPE_LABELS.lecture },
];
