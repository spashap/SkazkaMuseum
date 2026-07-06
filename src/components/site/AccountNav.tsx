import Link from 'next/link';
import AccountLogoutButton from './AccountLogoutButton';

const SECTIONS: { href: string; label: string }[] = [
  { href: '/account', label: 'Главная' },
  { href: '/account/upcoming', label: 'Мои ближайшие мероприятия' },
  { href: '/account/tickets', label: 'Все билеты' },
  { href: '/account/orders', label: 'История заказов' },
  { href: '/account/profile', label: 'Профиль' },
  { href: '/account/settings', label: 'Настройки' },
  { href: '/account/notifications', label: 'Уведомления' },
];

export default function AccountNav({ active }: { active: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="btn btn--outline-dark"
            style={{
              padding: '0.5rem 1.1rem', fontSize: '0.85rem',
              ...(active === s.href ? { background: 'var(--gold)', color: 'var(--dark)' } : {}),
            }}
          >
            {s.label}
          </Link>
        ))}
      </nav>
      <AccountLogoutButton />
    </div>
  );
}
