import { getCurrentClient } from '@/lib/customerAuth';
import CheckoutForm from '@/components/site/CheckoutForm';

export const metadata = { title: 'Оформление заказа' };

export default async function CheckoutPage() {
  const client = await getCurrentClient();

  return (
    <section className="section container" style={{ maxWidth: 480 }}>
      <div className="section__header text-center">
        <span className="eyebrow">Онлайн-касса</span>
        <h1>Оформление заказа</h1>
      </div>
      <CheckoutForm initialName={client?.fullName} initialPhone={client?.phone ?? undefined} initialEmail={client?.email ?? undefined} />
    </section>
  );
}
