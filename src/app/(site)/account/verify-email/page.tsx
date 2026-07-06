import VerifyEmailStatus from '@/components/site/VerifyEmailStatus';

export const metadata = { title: 'Подтверждение email' };

export default function VerifyEmailPage({ searchParams }: { searchParams: { token?: string } }) {
  return (
    <section className="section container" style={{ maxWidth: 480 }}>
      <div className="section__header text-center">
        <span className="eyebrow">Личный кабинет</span>
        <h1>Подтверждение email</h1>
      </div>
      <VerifyEmailStatus token={searchParams.token} />
    </section>
  );
}
