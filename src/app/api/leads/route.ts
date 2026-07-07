import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { notifyTelegram } from '@/lib/integrations/telegram';
import { sendEmail } from '@/lib/integrations/unisender';

// Site forms → Lead in admin "Заявки" (spec 2.2) + Telegram notify + email notify (dup channels).
const Schema = z.object({
  type: z.string(),
  name: z.string().min(1),
  phone: z.string().min(3),
  email: z.string().optional().nullable(),
  program: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  count: z.number().optional().nullable(),
  comment: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const d = parsed.data;

  const lead = await db.lead.create({
    data: {
      type: d.type, name: d.name, phone: d.phone, email: d.email || null,
      program: d.program || null, date: d.date || null,
      count: d.count || null, comment: d.comment || null, source: d.source || null,
    },
  });

  await notifyTelegram(
    `🆕 <b>Новая заявка</b>\nТип: ${d.type}\nИмя: ${d.name}\nТел: ${d.phone}` +
      (d.program ? `\nПрограмма: ${d.program}` : '') +
      (d.date ? `\nДата: ${d.date}` : '') +
      (d.count ? `\nЧел.: ${d.count}` : '') +
      (d.source ? `\nСтраница: ${d.source}` : '')
  );

  const company = await db.companySettings.findUnique({ where: { id: 1 } });
  const notifyEmail = company?.email || 'spb@skazka-museum.ru';
  await sendEmail({
    to: notifyEmail, fromEmail: notifyEmail, fromName: company?.name || 'Музей русской сказки',
    subject: `Новая заявка с сайта — ${d.type}`,
    html: `<p><b>Тип:</b> ${d.type}</p><p><b>Имя:</b> ${d.name}</p><p><b>Телефон:</b> ${d.phone}</p>` +
      (d.email ? `<p><b>Email:</b> ${d.email}</p>` : '') +
      (d.program ? `<p><b>Программа:</b> ${d.program}</p>` : '') +
      (d.date ? `<p><b>Дата:</b> ${d.date}</p>` : '') +
      (d.count ? `<p><b>Кол-во человек:</b> ${d.count}</p>` : '') +
      (d.comment ? `<p><b>Комментарий:</b> ${d.comment}</p>` : '') +
      (d.source ? `<p><b>Страница:</b> ${d.source}</p>` : ''),
  });

  return NextResponse.json({ ok: true, id: lead.id });
}
