import { NextResponse } from 'next/server';
import { createPayment } from '@/lib/integrations/yookassa';

// Starts a YooKassa payment. Returns a confirmation URL to redirect to, or
// { configured:false } while keys are missing (widget then shows a fallback message).
export async function POST(req: Request) {
  const { item, amount } = await req.json().catch(() => ({}));
  if (!amount || amount <= 0) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const origin = req.headers.get('origin') || 'https://skazkamuseum.ru';
  const result = await createPayment({
    amount,
    description: `Билет: ${item}`,
    returnUrl: `${origin}/tickets?paid=1`,
  });

  if (!result.ok) return NextResponse.json({ configured: false, reason: result.reason });
  return NextResponse.json({ confirmationUrl: result.confirmationUrl, id: result.id });
}
