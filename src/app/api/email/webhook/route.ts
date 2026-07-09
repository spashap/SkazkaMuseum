import crypto from 'crypto';
import { NextResponse } from 'next/server';

// UniSender GO event webhook — delivery / bounce / spam-complaint statuses for
// transactional mail. Register this URL in the UniSender GO dashboard
// (Настройки → Вебхуки): https://skazkamuseum.ru/api/email/webhook
//
// Authenticity per godocs.unisender.ru: the `auth` field is the MD5 of the raw
// request body with the auth value substituted by the account's API key.
//
// For now events are logged (visible via `pm2 logs skazkamuseum`) so undeliverable
// addresses and spam complaints are diagnosable; persisting them into the CRM is
// Phase 8 (UniSender flows) territory.
export async function POST(req: Request) {
  const raw = await req.text();
  let data: { auth?: string; events_by_user?: Array<{ events?: Array<{ event_name?: string; event_data?: Record<string, unknown> }> }> };
  try {
    data = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const apiKey = process.env.UNISENDER_GO_API_KEY;
  if (apiKey && data.auth) {
    const expected = crypto.createHash('md5').update(raw.replace(data.auth, apiKey)).digest('hex');
    if (expected !== data.auth) {
      console.warn('[unisender webhook] bad auth signature — ignoring');
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }

  for (const user of data.events_by_user ?? []) {
    for (const ev of user.events ?? []) {
      const d = ev.event_data ?? {};
      if (ev.event_name === 'transactional_email_status') {
        const line = `[unisender webhook] ${d.email}: ${d.status}` + (d.delivery_info ? ` — ${JSON.stringify(d.delivery_info).slice(0, 200)}` : '');
        // hard bounces & spam complaints are the ones that need a human eye
        if (d.status === 'hard_bounced' || d.status === 'spam') console.warn(line);
        else console.log(line);
      } else if (ev.event_name === 'transactional_spam_block') {
        console.warn('[unisender webhook] spam block:', JSON.stringify(d).slice(0, 300));
      }
    }
  }

  return NextResponse.json({ ok: true });
}
