import { redirect } from 'next/navigation';
import { getCurrentClient } from '@/lib/customerAuth';
import AccountNav from '@/components/site/AccountNav';
import ChangePasswordForm from '@/components/site/ChangePasswordForm';
import NotificationsToggle from '@/components/site/NotificationsToggle';

export const metadata = { title: 'Настройки' };

export default async function SettingsPage() {
  const client = await getCurrentClient();
  if (!client) redirect('/account');

  return (
    <section className="section container">
      <AccountNav active="/account/settings" />
      <h1>Настройки</h1>

      <h2>Уведомления</h2>
      <div className="form-card" style={{ maxWidth: 480, marginBottom: '2rem' }}>
        <NotificationsToggle initial={client.emailOptIn} />
      </div>

      <h2>Смена пароля</h2>
      <ChangePasswordForm />
    </section>
  );
}
