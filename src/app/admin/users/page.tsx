import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';

// User management (spec 3.12) — admin only. Create staff accounts with a role.
async function addUser(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session || !canAccess(session.role, 'users')) return;
  const bcrypt = (await import('bcryptjs')).default;
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  if (!email || password.length < 6) return;
  await db.user.upsert({
    where: { email },
    update: {},
    create: {
      email, passwordHash: await bcrypt.hash(password, 10),
      fullName: String(formData.get('fullName') || email),
      phone: String(formData.get('phone') || ''),
      role: String(formData.get('role') || 'MANAGER'),
    },
  });
  revalidatePath('/admin/users');
}

const ROLE_RU: Record<string, string> = { ADMIN: 'Администратор', MANAGER: 'Менеджер', CASHIER: 'Кассир' };

export default async function Users() {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'users')) redirect('/admin');
  const users = await db.user.findMany({ orderBy: { createdAt: 'asc' } });
  return (
    <>
      <h1>Пользователи системы</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: 'var(--fs-small)' }}>
        <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid var(--cream)' }}><th>ФИО</th><th>Email</th><th>Роль</th><th>Статус</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ borderBottom: '1px solid var(--cream)' }}>
              <td>{u.fullName}</td><td>{u.email}</td><td>{ROLE_RU[u.role] || u.role}</td><td>{u.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: '2rem' }}>Добавить сотрудника</h2>
      <form action={addUser} style={{ maxWidth: 480 }}>
        <div className="field"><label>ФИО</label><input name="fullName" /></div>
        <div className="field"><label>Email *</label><input name="email" type="email" required /></div>
        <div className="field"><label>Телефон</label><input name="phone" /></div>
        <div className="field"><label>Пароль * (мин. 6)</label><input name="password" type="text" required /></div>
        <div className="field"><label>Роль</label>
          <select name="role"><option value="MANAGER">Менеджер</option><option value="CASHIER">Кассир</option><option value="ADMIN">Администратор</option></select>
        </div>
        <button className="btn">Создать</button>
      </form>
    </>
  );
}
