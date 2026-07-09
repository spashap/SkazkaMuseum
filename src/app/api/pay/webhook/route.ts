import { NextResponse } from 'next/server';
import { verifyAndApplyPayment } from '@/lib/payments';
import { requestOrigin } from '@/lib/origin';

// YooKassa HTTP notifications. Configure in the YooKassa merchant dashboard
// (Интеграция → HTTP-уведомления): URL https://skazkamuseum.ru/api/pay/webhook,
// events payment.succeeded + payment.canceled — final states only.
//
// The body is unauthenticated, so it's treated as a hint: only the payment id
// is read from it, and the actual state is re-fetched from the YooKassa API
// (verifyAndApplyPayment). A forged request can therefore only make us
// re-check a real payment — never mark anything paid.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const paymentId: unknown = body?.object?.id;
  if (typeof paymentId !== 'string' || !paymentId) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const status = await verifyAndApplyPayment(paymentId, requestOrigin(req));
  if (status === null) {
    // Couldn't verify against the API right now — non-200 makes YooKassa retry
    // the notification later instead of dropping it.
    return NextResponse.json({ error: 'verification_failed' }, { status: 502 });
  }

  console.log(`[pay webhook] payment ${paymentId}: ${status}`);
  return NextResponse.json({ ok: true });
}
