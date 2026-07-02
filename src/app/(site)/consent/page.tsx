import { db } from '@/lib/db';

export const metadata = { title: 'Согласие на обработку персональных данных' };

export default async function Consent() {
  const c = await db.companySettings.findUnique({ where: { id: 1 } });
  return (
    <section className="section container" style={{ maxWidth: 820 }}>
      <h1>Согласие на обработку персональных данных</h1>
      <p className="caption">Шаблон (152-ФЗ). Итоговый текст согласуется с юристом заказчика.</p>
      <p>Отправляя форму на сайте {c?.name}, пользователь даёт согласие на обработку своих
        персональных данных (имя, телефон, email) оператором {c?.name} в целях обработки заявки
        и предоставления услуг. Согласие может быть отозвано письменно по адресу {c?.email}.</p>
    </section>
  );
}
