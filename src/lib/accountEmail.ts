import { db } from './db';
import { sendEmail } from './integrations/unisender';
import type { Client } from '@prisma/client';

// Shared by the account API routes so the "from" address / sender name and the
// no-op-when-unconfigured logging behavior live in exactly one place.
async function fromAddress() {
  const c = await db.companySettings.findUnique({ where: { id: 1 } });
  return { fromEmail: c?.email || 'noreply@skazkamuseum.ru', fromName: c?.name || 'Музей русской сказки' };
}

export async function sendVerifyEmail(client: Client, origin: string) {
  if (!client.email || !client.emailVerifyToken) return;
  const { fromEmail, fromName } = await fromAddress();
  const link = `${origin}/account/verify-email?token=${client.emailVerifyToken}`;
  await sendEmail({
    to: client.email, toName: client.fullName, fromEmail, fromName,
    subject: 'Подтвердите email — Музей русской сказки',
    html: `<p>Здравствуйте, ${client.fullName}!</p><p>Подтвердите ваш email для личного кабинета: <a href="${link}">${link}</a></p>`,
  });
}

export async function sendResetPasswordEmail(client: Client, origin: string) {
  if (!client.email || !client.resetToken) return;
  const { fromEmail, fromName } = await fromAddress();
  const link = `${origin}/account/reset-password?token=${client.resetToken}`;
  await sendEmail({
    to: client.email, toName: client.fullName, fromEmail, fromName,
    subject: 'Восстановление пароля — Музей русской сказки',
    html: `<p>Здравствуйте, ${client.fullName}!</p><p>Для сброса пароля перейдите по ссылке: <a href="${link}">${link}</a></p><p>Ссылка действует 30 минут. Если вы не запрашивали сброс — просто проигнорируйте это письмо.</p>`,
  });
}
