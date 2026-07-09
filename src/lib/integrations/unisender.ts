// UniSender GO — transactional email (tickets, confirmations, reminders).
// Inert until UNISENDER_GO_API_KEY is set in .env.
// Docs: https://godocs.unisender.ru/web-api-ref (v2).
//
// The FROM address is decided HERE, in one place, and only here: UniSender only
// accepts senders on the DKIM-verified domain (skazkamuseum.ru), so callers may
// not pick their own from_email — the company inbox (spb@skazka-museum.ru, a
// DIFFERENT domain) would be silently rejected. Callers that want replies to go
// to the company inbox pass it as `replyTo` instead.
//
// The account lives on the go2 cluster (go2.unisender.ru) — an API key only
// works against its own cluster, so a go1 request answers "invalid key".
const UNISENDER_HOST = process.env.UNISENDER_GO_HOST || 'go2.unisender.ru';
const FROM_EMAIL = process.env.MAIL_FROM_EMAIL || 'noreply@skazkamuseum.ru';

export async function sendEmail(opts: {
  to: string; toName?: string; subject: string; html: string; fromName?: string; replyTo?: string;
  attachment?: { filename: string; contentType: string; content: Buffer };
}): Promise<boolean> {
  const apiKey = process.env.UNISENDER_GO_API_KEY;
  if (!apiKey) {
    console.log('[unisender] not configured — skipping. Would send to', opts.to, '—', opts.subject);
    if (opts.attachment) console.log('[unisender] would attach', opts.attachment.filename);
    return false;
  }
  try {
    const res = await fetch(`https://${UNISENDER_HOST}/ru/transactional/api/v1/email/send.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
      body: JSON.stringify({
        message: {
          recipients: [{ email: opts.to, substitutions: { to_name: opts.toName || '' } }],
          subject: opts.subject,
          body: { html: opts.html },
          from_email: FROM_EMAIL,
          from_name: opts.fromName || 'Музей русской сказки',
          ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
          ...(opts.attachment
            ? { attachments: [{ type: opts.attachment.contentType, name: opts.attachment.filename, content: opts.attachment.content.toString('base64') }] }
            : {}),
        },
      }),
    });
    if (!res.ok) {
      // UniSender explains rejections (unverified sender, bad key, …) in the body —
      // without this log a failed send is indistinguishable from a lost email.
      const detail = await res.text().catch(() => '');
      console.error(`[unisender] send rejected (${res.status}) to ${opts.to}: ${detail.slice(0, 500)}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[unisender] send failed', e);
    return false;
  }
}
