import { redirect } from 'next/navigation';
import { getCurrentClient } from '@/lib/customerAuth';
import AccountNav from '@/components/site/AccountNav';
import ProfileForm from '@/components/site/ProfileForm';

export const metadata = { title: 'Профиль' };

export default async function ProfilePage() {
  const client = await getCurrentClient();
  if (!client) redirect('/account');

  return (
    <section className="section container">
      <AccountNav active="/account/profile" />
      <h1>Профиль</h1>
      <ProfileForm client={client} />
    </section>
  );
}
