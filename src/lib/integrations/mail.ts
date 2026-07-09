import nodemailer from 'nodemailer';

// Transactional email via Yandex 360 SMTP (the museum's own domain mail).
// Inert until YANDEX_SMTP_PASSWORD is set in .env (an app password for the
// mailbox — NOT its normal password; see id.yandex.ru → Безопасность →
// Пароли приложений).
//
// The FROM address is decided HERE and only here: Yandex rejects mail whose
// From doesn't match the authenticated mailbox, so callers may not pick their
// own sender. Callers that want replies to land elsewhere pass `replyTo`.
const SMTP_USER = process.env.YANDEX_SMTP_USER || 'spb@skazkamuseum.ru';

let transport: nodemailer.Transporter | null = null;
function getTransport(pass: string): nodemailer.Transporter {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: 'smtp.yandex.ru',
      port: 465,
      secure: true,
      auth: { user: SMTP_USER, pass },
    });
  }
  return transport;
}

export async function sendEmail(opts: {
  to: string; toName?: string; subject: string; html: string; fromName?: string; replyTo?: string;
  attachment?: { filename: string; contentType: string; content: Buffer };
}): Promise<boolean> {
  const pass = process.env.YANDEX_SMTP_PASSWORD;
  if (!pass) {
    console.log('[mail] not configured — skipping. Would send to', opts.to, '—', opts.subject);
    if (opts.attachment) console.log('[mail] would attach', opts.attachment.filename);
    return false;
  }
  try {
    await getTransport(pass).sendMail({
      from: { name: opts.fromName || 'Музей русской сказки', address: SMTP_USER },
      to: opts.toName ? { name: opts.toName, address: opts.to } : opts.to,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
      subject: opts.subject,
      html: opts.html,
      ...(opts.attachment
        ? { attachments: [{ filename: opts.attachment.filename, content: opts.attachment.content, contentType: opts.attachment.contentType }] }
        : {}),
    });
    return true;
  } catch (e) {
    console.error(`[mail] send failed to ${opts.to}:`, e instanceof Error ? e.message : e);
    return false;
  }
}
