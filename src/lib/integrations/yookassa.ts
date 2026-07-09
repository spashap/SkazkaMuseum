// YooKassa payments. Inert until YOOKASSA_SHOP_ID + YOOKASSA_SECRET_KEY are set in .env.
// Docs: https://yookassa.ru/developers/api
//
// The site uses the EMBEDDED confirmation flow: createPayment returns a
// confirmation_token and the checkout page renders YooKassa's widget inside a
// modal — the buyer never leaves the site. The fiscal receipt (чек 54-ФЗ) is
// issued by YooKassa itself, so every payment carries a receipt block with the
// ticket lines (vat_code 1 = без НДС).

export type ReceiptItem = { description: string; amountRub: number; quantity: number };

function authHeader(shopId: string, secret: string): string {
  return 'Basic ' + Buffer.from(`${shopId}:${secret}`).toString('base64');
}

function configured(): { shopId: string; secret: string } | null {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secret = process.env.YOOKASSA_SECRET_KEY;
  return shopId && secret ? { shopId, secret } : null;
}

export async function createEmbeddedPayment(opts: {
  amountRub: number;
  description: string;
  metadata: Record<string, string>;
  customer: { email?: string; phone?: string };
  items: ReceiptItem[];
}): Promise<{ ok: true; confirmationToken: string; id: string } | { ok: false; reason: string }> {
  const cfg = configured();
  if (!cfg) {
    console.log('[yookassa] not configured — returning stub. Amount:', opts.amountRub);
    return { ok: false, reason: 'not_configured' };
  }
  try {
    const res = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': crypto.randomUUID(),
        Authorization: authHeader(cfg.shopId, cfg.secret),
      },
      body: JSON.stringify({
        amount: { value: opts.amountRub.toFixed(2), currency: 'RUB' },
        capture: true,
        confirmation: { type: 'embedded' },
        description: opts.description.slice(0, 128),
        metadata: opts.metadata,
        merchant_customer_id: opts.customer.email || opts.customer.phone || undefined,
        receipt: {
          customer: opts.customer.email ? { email: opts.customer.email } : { phone: opts.customer.phone },
          items: opts.items.map((it) => ({
            description: it.description.slice(0, 128),
            quantity: it.quantity.toFixed(2),
            amount: { value: it.amountRub.toFixed(2), currency: 'RUB' },
            vat_code: 1,
            payment_subject: 'service',
            payment_mode: 'full_payment',
          })),
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error(`[yookassa] create rejected (${res.status}):`, JSON.stringify(data).slice(0, 500));
      return { ok: false, reason: data?.description || 'error' };
    }
    const token = data.confirmation?.confirmation_token;
    if (!token) return { ok: false, reason: 'no_confirmation_token' };
    return { ok: true, confirmationToken: token, id: data.id };
  } catch (e) {
    console.error('[yookassa] create failed', e);
    return { ok: false, reason: 'exception' };
  }
}

// Re-fetch a payment from YooKassa — the ONLY trusted source of payment state.
// Webhook bodies are unauthenticated, so handlers verify through this call.
export async function getPayment(paymentId: string): Promise<{
  id: string; status: string; paid: boolean; amountRub: number; metadata: Record<string, string>;
} | null> {
  const cfg = configured();
  if (!cfg) return null;
  try {
    const res = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
      headers: { Authorization: authHeader(cfg.shopId, cfg.secret) },
    });
    if (!res.ok) {
      console.error(`[yookassa] get_payment ${paymentId} → HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    return {
      id: data.id,
      status: data.status,
      paid: Boolean(data.paid),
      amountRub: Number(data.amount?.value || 0),
      metadata: data.metadata || {},
    };
  } catch (e) {
    console.error('[yookassa] get_payment failed', e);
    return null;
  }
}
