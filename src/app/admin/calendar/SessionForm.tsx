import type { Event, Program } from '@prisma/client';
import { SESSION_STATUSES } from './constants';

const STATUS_RU: Record<string, string> = { scheduled: 'Запланирован', cancelled: 'Отменён', hidden: 'Скрыт' };

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function timeKey(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SessionForm({
  programs,
  event,
  action,
}: {
  programs: Program[];
  event?: Event;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} style={{ maxWidth: 560 }}>
      {event && <input type="hidden" name="id" value={event.id} />}

      <div className="field">
        <label>Программа *</label>
        <select name="programId" required defaultValue={event?.programId ?? programs[0]?.id}>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      <div className="grid grid--2">
        <div className="field"><label>Дата *</label><input name="date" type="date" required defaultValue={event ? dateKey(event.startAt) : ''} /></div>
        <div className="field"><label>Количество мест *</label><input name="capacity" type="number" min={1} required defaultValue={event?.capacity ?? 30} /></div>
        <div className="field"><label>Время начала *</label><input name="startTime" type="time" required defaultValue={event ? timeKey(event.startAt) : ''} /></div>
        <div className="field"><label>Время окончания</label><input name="endTime" type="time" defaultValue={event ? timeKey(event.endAt) : ''} /></div>
      </div>

      <div className="field">
        <label>Статус</label>
        <select name="status" defaultValue={event?.status ?? 'scheduled'}>
          {SESSION_STATUSES.map((s) => <option key={s} value={s}>{STATUS_RU[s]}</option>)}
        </select>
      </div>
      <p className="caption">Если время окончания не указано, оно рассчитывается автоматически из длительности программы.</p>

      <button className="btn" style={{ marginTop: '0.5rem' }}>{event ? 'Сохранить' : 'Создать сеанс'}</button>
    </form>
  );
}
