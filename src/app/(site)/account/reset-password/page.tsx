import ResetPasswordForm from '@/components/site/ResetPasswordForm';

export const metadata = { title: 'Восстановление пароля' };

export default function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  return (
    <section className="section container" style={{ maxWidth: 480 }}>
      <div className="section__header text-center">
        <span className="eyebrow">Личный кабинет</span>
        <h1>Восстановление пароля</h1>
      </div>
      <ResetPasswordForm token={searchParams.token} />
    </section>
  );
}
