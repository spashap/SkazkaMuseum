import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, canAccess, type Role } from '@/lib/auth';
import { getVersion } from '@/lib/version';
import LogoutButton from '@/components/admin/LogoutButton';

const SECTIONS: { id: string; href: string; label: string }[] = [
  { id: 'dashboard', href: '/admin', label: 'Главная панель' },
  { id: 'zayavki', href: '/admin/zayavki', label: 'Заявки с сайта' },
  { id: 'bookings', href: '/admin/bookings', label: 'Бронирования' },
  { id: 'clients', href: '/admin/clients', label: 'Клиенты (CRM)' },
  { id: 'calendar', href: '/admin/calendar', label: 'Календарь' },
  { id: 'programs', href: '/admin/programs', label: 'Мероприятия' },
  { id: 'finance', href: '/admin/finance', label: 'Финансы' },
  { id: 'analytics', href: '/admin/analytics', label: 'Аналитика' },
  { id: 'promo', href: '/admin/promo', label: 'Акции и промокоды' },
  { id: 'images', href: '/admin/images', label: 'Изображения' },
  { id: 'design', href: '/admin/design', label: 'Дизайн (шрифты/цвета)' },
  { id: 'users', href: '/admin/users', label: 'Пользователи' },
  { id: 'settings', href: '/admin/settings', label: 'Настройки' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  const role = session.role as Role;
  const visible = SECTIONS.filter((s) => canAccess(role, s.id));
  const version = await getVersion();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 240, background: 'var(--dark)', color: 'var(--cream)', padding: '1.25rem', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: 'var(--fs-h3)', marginBottom: '0.25rem' }}>
          Личный кабинет
        </div>
        <p className="caption" style={{ color: 'var(--text-light)' }}>{session.name} · {role}</p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '1rem' }}>
          {visible.map((s) => (
            <Link key={s.id} href={s.href} style={{ color: 'var(--cream)', padding: '0.5rem 0.6rem', borderRadius: 'var(--radius)', fontSize: 'var(--fs-small)' }}>
              {s.label}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: '1.5rem' }}><LogoutButton /></div>
        <Link href="/" className="caption" style={{ color: 'var(--gold-light)', display: 'block', marginTop: '1rem' }}>← На сайт</Link>
        {version && <p className="caption" style={{ color: 'var(--text-light)', marginTop: '1rem' }}>{version}</p>}
      </aside>
      <div style={{ flex: 1, background: 'var(--white)', minWidth: 0 }}>
        <div style={{ padding: '1.5rem 2rem' }}>{children}</div>
      </div>
    </div>
  );
}
