'use client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login'); router.refresh();
  }
  return (
    <button className="btn btn--outline" onClick={logout} style={{ color: 'var(--cream)', boxShadow: 'inset 0 0 0 2px var(--gold)', width: '100%' }}>
      Выйти
    </button>
  );
}
