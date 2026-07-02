import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';

// Company data — fixes the placeholder data from the prototype; feeds footer, contacts,
// map, legal pages, email sender. All in one place.
async function save(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session || !canAccess(session.role, 'settings')) return;
  const f = (k: string) => String(formData.get(k) || '');
  await db.companySettings.update({
    where: { id: 1 },
    data: {
      name: f('name'), address: f('address'), metro: f('metro'), phone: f('phone'),
      email: f('email'), telegram: f('telegram'), maxLink: f('maxLink'),
      lat: f('lat'), lon: f('lon'), metrikaId: f('metrikaId'), yandexVerification: f('yandexVerification'),
    },
  });
  revalidatePath('/', 'layout');
}

function F({ name, label, value }: { name: string; label: string; value: string }) {
  return <div className="field"><label>{label}</label><input name={name} defaultValue={value} /></div>;
}

export default async function Settings() {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'settings')) redirect('/admin');
  const c = (await db.companySettings.findUnique({ where: { id: 1 } }))!;
  return (
    <>
      <h1>Настройки — данные организации</h1>
      <form action={save} style={{ marginTop: '1rem', maxWidth: 640 }}>
        <F name="name" label="Название" value={c.name} />
        <F name="address" label="Адрес" value={c.address} />
        <F name="metro" label="Метро" value={c.metro} />
        <F name="phone" label="Телефон" value={c.phone} />
        <F name="email" label="Email (отправитель писем)" value={c.email} />
        <F name="telegram" label="Telegram" value={c.telegram} />
        <F name="maxLink" label="MAX" value={c.maxLink} />
        <F name="lat" label="Широта (карта)" value={c.lat} />
        <F name="lon" label="Долгота (карта)" value={c.lon} />
        <F name="metrikaId" label="Яндекс.Метрика — номер счётчика" value={c.metrikaId} />
        <F name="yandexVerification" label="Яндекс.Вебмастер — токен" value={c.yandexVerification} />
        <button className="btn" style={{ marginTop: '1rem' }}>Сохранить</button>
      </form>
    </>
  );
}
