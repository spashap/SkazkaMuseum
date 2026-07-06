'use client';

import { useRef } from 'react';
import type { Program } from '@prisma/client';
import { bulkCreateSessions } from './actions';

const WEEKDAYS = [
  { value: 1, label: 'Пн' }, { value: 2, label: 'Вт' }, { value: 3, label: 'Ср' }, { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' }, { value: 6, label: 'Сб' }, { value: 0, label: 'Вс' },
];

export default function BulkScheduleForm({ programs }: { programs: Program[] }) {
  const dateToRef = useRef<HTMLInputElement>(null);

  function fillEndOfYear() {
    if (!dateToRef.current) return;
    const year = new Date().getFullYear();
    dateToRef.current.value = `${year}-12-31`;
  }

  return (
    <form action={bulkCreateSessions} style={{ maxWidth: 560 }}>
      <div className="field">
        <label>Программа *</label>
        <select name="programId" required defaultValue={programs[0]?.id}>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      <div className="field">
        <label>Дни недели *</label>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {WEEKDAYS.map((w) => (
            <label key={w.value} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 400 }}>
              <input type="checkbox" name="weekdays" value={w.value} defaultChecked /> {w.label}
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Время начала сеансов *</label>
        <textarea name="times" rows={2} placeholder="напр. 11:00, 15:00, 18:00" required />
        <p className="caption">Через запятую или с новой строки. Для каждого времени будет создан отдельный сеанс.</p>
      </div>

      <div className="grid grid--2">
        <div className="field"><label>Дата начала *</label><input name="dateFrom" type="date" required /></div>
        <div className="field">
          <label>Дата окончания *</label>
          <input name="dateTo" type="date" required ref={dateToRef} />
          <button type="button" className="btn btn--outline" style={{ marginTop: '0.4rem', padding: '0.3rem 0.7rem', width: 'fit-content' }} onClick={fillEndOfYear}>
            До конца года
          </button>
        </div>
      </div>

      <div className="field"><label>Количество мест на сеанс *</label><input name="capacity" type="number" min={1} required defaultValue={30} /></div>

      <p className="caption">Сеансы, которые уже существуют в это время у этой программы, повторно созданы не будут — правило можно безопасно запустить ещё раз.</p>

      <button className="btn" style={{ marginTop: '0.5rem' }}>Создать расписание</button>
    </form>
  );
}
