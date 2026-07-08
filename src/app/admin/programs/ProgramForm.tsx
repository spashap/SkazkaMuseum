import type { Program } from '@prisma/client';
import { PROGRAM_TYPES, PROGRAM_TYPE_LABELS, PROGRAM_STATUSES } from '@/lib/programTypes';

const STATUS_RU: Record<string, string> = { active: 'Активна', draft: 'Черновик', archived: 'В архиве' };

export default function ProgramForm({
  program,
  action,
}: {
  program?: Program;
  action: (formData: FormData) => void;
}) {
  const cover = program ? (JSON.parse(program.images || '[]')[0] as string | undefined) : undefined;

  return (
    <form action={action} encType="multipart/form-data" style={{ maxWidth: 720 }}>
      {program && <input type="hidden" name="id" value={program.id} />}

      <h2>Основное</h2>
      <div className="field"><label>Название программы *</label><input name="title" required defaultValue={program?.title} /></div>
      <div className="field"><label>Тип программы</label>
        <select name="type" defaultValue={program?.type ?? 'excursion'}>
          {PROGRAM_TYPES.map((t) => <option key={t} value={t}>{PROGRAM_TYPE_LABELS[t]}</option>)}
        </select>
      </div>
      <div className="field"><label>Краткое описание</label><textarea name="shortDesc" rows={2} defaultValue={program?.shortDesc} /></div>
      <div className="field"><label>Полное описание</label><textarea name="fullDesc" rows={6} defaultValue={program?.fullDesc} /></div>
      <div className="field"><label>Статус</label>
        <select name="status" defaultValue={program?.status ?? 'active'}>
          {PROGRAM_STATUSES.map((s) => <option key={s} value={s}>{STATUS_RU[s]}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Изображение программы</label>
        {cover && <img src={cover} alt="" style={{ width: 200, borderRadius: 'var(--radius)', marginBottom: '0.5rem' }} />}
        <input type="file" name="image" accept="image/*" />
      </div>

      <h2 style={{ marginTop: '1.5rem' }}>Параметры</h2>
      <div className="grid grid--2">
        <div className="field"><label>Продолжительность (мин)</label><input name="durationMin" type="number" min={1} required defaultValue={program?.durationMin ?? 60} /></div>
        <div className="field"><label>Возрастная категория</label><input name="ageLimit" placeholder="напр. 6+" defaultValue={program?.ageLimit} /></div>
        <div className="field"><label>Мин. количество человек</label><input name="minGroup" type="number" min={1} required defaultValue={program?.minGroup ?? 1} /></div>
        <div className="field"><label>Макс. количество человек</label><input name="maxGroup" type="number" min={1} required defaultValue={program?.maxGroup ?? 30} /></div>
      </div>

      <h2 style={{ marginTop: '1.5rem' }}>Цены</h2>
      <div className="grid grid--2">
        <div className="field"><label>Цена взрослого билета, ₽</label><input name="priceAdult" type="number" min={0} required defaultValue={program?.priceAdult ?? 0} /></div>
        <div className="field"><label>Цена детского билета, ₽</label><input name="priceChild" type="number" min={0} required defaultValue={program?.priceChild ?? 0} /></div>
        <div className="field"><label>Цена группы, ₽</label><input name="priceGroup" type="number" min={0} required defaultValue={program?.priceGroup ?? 0} /></div>
      </div>
      {!program && <p className="caption">Дополнительные услуги (upsell) можно добавить после создания программы, на странице редактирования.</p>}

      <h2 style={{ marginTop: '1.5rem' }}>Льготные билеты</h2>
      <p className="caption">Действуют только для входных билетов и экскурсий — переключатель ни на что не влияет для остальных типов программ.</p>
      <div className="grid grid--2">
        <div className="field">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" name="reducedEnabled" defaultChecked={program?.reducedEnabled ?? true} style={{ width: 'auto' }} />
            Продавать льготные билеты для этой программы
          </label>
        </div>
        <div className="field"><label>Размер скидки, %</label><input name="reducedDiscountPercent" type="number" min={0} max={100} required defaultValue={program?.reducedDiscountPercent ?? 30} /></div>
      </div>

      <h2 style={{ marginTop: '1.5rem' }}>SEO</h2>
      <div className="field"><label>SEO title</label><input name="seoTitle" defaultValue={program?.seoTitle} /></div>
      <div className="field"><label>SEO description</label><textarea name="seoDescription" rows={2} defaultValue={program?.seoDescription} /></div>
      <div className="field"><label>URL slug</label><input name="slug" placeholder="автоматически из названия, если пусто" defaultValue={program?.slug} /></div>

      <button className="btn" style={{ marginTop: '0.5rem' }}>{program ? 'Сохранить' : 'Создать программу'}</button>
    </form>
  );
}
