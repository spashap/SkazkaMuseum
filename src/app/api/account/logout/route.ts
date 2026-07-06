import { NextResponse } from 'next/server';
import { clearCustomerSession } from '@/lib/customerAuth';

export async function POST() {
  clearCustomerSession();
  return NextResponse.json({ ok: true });
}
