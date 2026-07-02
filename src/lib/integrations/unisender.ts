// UniSender GO v2 — transactional email (tickets, confirmations, reminders).
// Inert until UNISENDER_GO_API_KEY is set in .env. Sender from COMPANY email/settings.
// Docs: https://godocs.unisender.ru/web-api-ref (v2). Endpoint: /transactional/api/v1/email/send.json
export async function sendEmail(opts: {
  to: string; toName?: string; subject: string; html: string; fromEmail: string; fromName?: string;
}): Promise<boolean> {
  const apiKey = process.env.UNISENDER_GO_API_KEY;
  if (!apiKey) {
    console.log('[unisender] not configured — skipping. Would send to', opts.to, '—', opts.subject);
    return false;
  }
  try {
    const res = await fetch('https://go1.unisender.ru/ru/transactional/api/v1/email/send.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
      body: JSON.stringify({
        message: {
          recipients: [{ email: opts.to, substitutions: { to_name: opts.toName || '' } }],
          subject: opts.subject,
          body: { html: opts.html },
          from_email: opts.fromEmail,
          from_name: opts.fromName || 'Музей русской сказки',
        },
      }),
    });
    return res.ok;
  } catch (e) {
    console.error('[unisender] send failed', e);
    return false;
  }
}
