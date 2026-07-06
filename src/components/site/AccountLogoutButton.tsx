'use client';
import { useRouter } from 'next/navigation';

export default function AccountLogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch('/api/account/logout', { method: 'POST' });
    router.push('/account'); router.refresh();
  }
  return (
    <button className="btn btn--outline-dark" onClick={logout} style={{ padding: '0.5rem 1.1rem' }}>
      Выйти
    </button>
  );
}
