import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';

// Design control (single CSS control). Editing here updates the Theme row →
// the whole site + admin re-render with new fonts/sizes/colors on next load.
async function save(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session || !canAccess(session.role, 'design')) return;
  const f = (k: string) => String(formData.get(k) || '');
  await db.theme.update({
    where: { id: 1 },
    data: {
      fontDisplay: f('fontDisplay'), fontSerif: f('fontSerif'), fontBody: f('fontBody'),
      fsHeroXl: f('fsHeroXl'), fsH1: f('fsH1'), fsH2: f('fsH2'), fsH3: f('fsH3'),
      fsBody: f('fsBody'), fsSmall: f('fsSmall'), fsCaption: f('fsCaption'),
      gold: f('gold'), goldLight: f('goldLight'), goldDark: f('goldDark'), crimson: f('crimson'), crimsonDark: f('crimsonDark'),
      forest: f('forest'), cream: f('cream'), dark: f('dark'), text: f('text'),
      textLight: f('textLight'), white: f('white'), radius: f('radius'),
    },
  });
  revalidatePath('/', 'layout');
}

function Row({ name, label, value, color }: { name: string; label: string; value: string; color?: boolean }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input name={name} defaultValue={value} style={{ flex: 1 }} />
        {color && <input type="color" defaultValue={value} onChange={(e) => { const i = e.currentTarget.previousElementSibling as HTMLInputElement; i.value = e.currentTarget.value; }} />}
      </div>
    </div>
  );
}

export default async function Design() {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'design')) redirect('/admin');
  const t = (await db.theme.findUnique({ where: { id: 1 } }))!;
  return (
    <>
      <h1>Дизайн — шрифты, размеры, цвета</h1>
      <p className="caption">Одно место управления оформлением всего сайта. Изменение шрифта заголовков меняет их на всех страницах.</p>
      <form action={save} style={{ marginTop: '1rem', maxWidth: 640 }}>
        <h2>Шрифты</h2>
        <Row name="fontDisplay" label="Заголовки (display)" value={t.fontDisplay} />
        <Row name="fontSerif" label="Акцент (serif)" value={t.fontSerif} />
        <Row name="fontBody" label="Основной текст" value={t.fontBody} />
        <h2>Размеры</h2>
        <Row name="fsHeroXl" label="Заголовок героя" value={t.fsHeroXl} />
        <Row name="fsH1" label="H1" value={t.fsH1} />
        <Row name="fsH2" label="H2" value={t.fsH2} />
        <Row name="fsH3" label="H3" value={t.fsH3} />
        <Row name="fsBody" label="Текст" value={t.fsBody} />
        <Row name="fsSmall" label="Мелкий" value={t.fsSmall} />
        <Row name="fsCaption" label="Подпись" value={t.fsCaption} />
        <h2>Цвета</h2>
        <Row name="gold" label="Золото" value={t.gold} color />
        <Row name="goldLight" label="Золото светлое" value={t.goldLight} color />
        <Row name="goldDark" label="Золото тёмное (мелкие надписи)" value={t.goldDark} color />
        <Row name="crimson" label="Багряный" value={t.crimson} color />
        <Row name="crimsonDark" label="Багряный тёмный" value={t.crimsonDark} color />
        <Row name="forest" label="Зелёный" value={t.forest} color />
        <Row name="cream" label="Кремовый (фон)" value={t.cream} color />
        <Row name="dark" label="Тёмный" value={t.dark} color />
        <Row name="text" label="Текст" value={t.text} color />
        <Row name="textLight" label="Текст светлый" value={t.textLight} color />
        <Row name="white" label="Белый" value={t.white} color />
        <Row name="radius" label="Скругление (radius)" value={t.radius} />
        <button className="btn" style={{ marginTop: '1rem' }}>Сохранить</button>
      </form>
    </>
  );
}
