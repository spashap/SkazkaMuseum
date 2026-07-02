import { db } from '@/lib/db';

export const metadata = { title: 'Публичная оферта' };

export default async function Offer() {
  const c = await db.companySettings.findUnique({ where: { id: 1 } });
  return (
    <section className="section container" style={{ maxWidth: 820 }}>
      <h1>Публичная оферта</h1>
      <p className="caption">Шаблон. Итоговый текст согласуется с юристом заказчика перед приёмом онлайн-оплаты.</p>
      <p>{c?.name} (далее — Музей) предлагает физическим лицам приобрести билеты и услуги на условиях
        настоящей оферты. Оплата билета означает согласие с условиями. Возврат осуществляется в
        соответствии с законодательством РФ. Контакты: {c?.email}, {c?.phone}, {c?.address}.</p>
    </section>
  );
}
