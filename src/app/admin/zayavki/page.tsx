import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import { redirect } from 'next/navigation';

// Leads inbox (spec 3.4). Convert → creates a Booking (+ Client) and marks lead converted.
async function convertLead(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session || !canAccess(session.role, 'zayavki')) return;
  const id = String(formData.get('id'));
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead || lead.status === 'converted') return;

  const client = await db.client.upsert({
    where: { phone: lead.phone },
    update: { email: lead.email || undefined },
    create: { fullName: lead.name, phone: lead.phone, email: lead.email, source: 'site' },
  });
  const last = await db.booking.findFirst({ orderBy: { number: 'desc' } });
  const number = (last?.number ?? 1000) + 1;
  await db.booking.create({
    data: {
      number, leadId: lead.id, clientId: client.id, status: 'new',
      children: lead.count || 0, clientNote: lead.comment || '',
      historyJson: JSON.stringify([{ at: new Date().toISOString(), status: 'new', by: session.name }]),
    },
  });
  await db.lead.update({ where: { id }, data: { status: 'converted' } });
  revalidatePath('/admin/zayavki');
}

async function rejectLead(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session || !canAccess(session.role, 'zayavki')) return;
  await db.lead.update({ where: { id: String(formData.get('id')) }, data: { status: 'rejected' } });
  revalidatePath('/admin/zayavki');
}

const STATUS_RU: Record<string, string> = { new: 'Новая', in_progress: 'В обработке', converted: 'В бронировании', rejected: 'Отклонена' };

export default async function Zayavki() {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'zayavki')) redirect('/admin');
  const leads = await db.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });

  return (
    <>
      <h1>Заявки с сайта</h1>
      {leads.length === 0 && <p className="caption">Заявок пока нет. Они появятся здесь после отправки форм на сайте.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
        {leads.map((l) => (
          <div key={l.id} className="card"><div className="card__body" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <strong>{l.name}</strong> · {l.phone} {l.email && `· ${l.email}`}<br />
              <span className="small">{l.type}{l.program ? ` · ${l.program}` : ''}{l.date ? ` · ${l.date}` : ''}{l.count ? ` · ${l.count} чел.` : ''}{l.source ? ` · со страницы ${l.source}` : ''}</span>
              {l.comment && <p className="small">«{l.comment}»</p>}
              <span className="caption">{new Date(l.createdAt).toLocaleString('ru-RU')} · Статус: {STATUS_RU[l.status]}</span>
            </div>
            {l.status === 'new' && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <form action={convertLead}><input type="hidden" name="id" value={l.id} /><button className="btn" style={{ padding: '0.4rem 0.9rem' }}>В бронирование</button></form>
                <form action={rejectLead}><input type="hidden" name="id" value={l.id} /><button className="btn btn--outline" style={{ padding: '0.4rem 0.9rem' }}>Отклонить</button></form>
              </div>
            )}
          </div></div>
        ))}
      </div>
    </>
  );
}
