// YooKassa payments. Inert until YOOKASSA_SHOP_ID + YOOKASSA_SECRET_KEY are set in .env.
// createPayment returns a confirmation URL to redirect the client to.
// Docs: https://yookassa.ru/developers/api
export async function createPayment(opts: {
  amount: number; description: string; returnUrl: string; metadata?: Record<string, string>;
}): Promise<{ ok: boolean; confirmationUrl?: string; id?: string; reason?: string }> {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secret = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secret) {
    console.log('[yookassa] not configured — returning stub. Amount:', opts.amount);
    return { ok: false, reason: 'not_configured' };
  }
  try {
    const res = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': crypto.randomUUID(),
        Authorization: 'Basic ' + Buffer.from(`${shopId}:${secret}`).toString('base64'),
      },
      body: JSON.stringify({
        amount: { value: opts.amount.toFixed(2), currency: 'RUB' },
        capture: true,
        confirmation: { type: 'redirect', return_url: opts.returnUrl },
        description: opts.description,
        metadata: opts.metadata || {},
      }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, reason: data?.description || 'error' };
    return { ok: true, confirmationUrl: data.confirmation?.confirmation_url, id: data.id };
  } catch (e) {
    console.error('[yookassa] create failed', e);
    return { ok: false, reason: 'exception' };
  }
}
