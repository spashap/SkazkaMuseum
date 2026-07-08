'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCart, clearCart, removeItem, cartTotal, type CartItem } from '@/lib/cart';
import ReducedTicketNotice from './ReducedTicketNotice';

// Sessions are always in Moscow time — extract the calendar date against that
// timezone explicitly, so a buyer's own device timezone can't shift it to the
// next/previous day near midnight.
const dateKeyFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Moscow' });
function dateKey(iso: string): string {
  return dateKeyFmt.format(new Date(iso));
}

type ItemResult = { item: CartItem; ok: boolean; number?: number; error?: string };
type Step = 'form' | 'submitting' | 'result' | 'payment';

const ORDER_ERROR_RU: Record<string, string> = {
  sold_out: 'Мест не осталось',
  invalid_rate: 'Этот тариф недоступен для данной программы',
  invalid_reduced_category: 'Не выбрана льготная категория',
};

export default function CheckoutForm({ initialName, initialPhone, initialEmail }: { initialName?: string; initialPhone?: string; initialEmail?: string }) {
  const [items, setItems] = useState<CartItem[] | null>(null);
  const [step, setStep] = useState<Step>('form');
  const [results, setResults] = useState<ItemResult[]>([]);
  const [payMsg, setPayMsg] = useState('');

  useEffect(() => { setItems(getCart()); }, []);

  const hasReduced = items?.some((i) => i.items.some((li) => li.rateId === 'reduced' && li.qty > 0)) ?? false;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!items || items.length === 0) return;
    setStep('submitting');
    const fd = new FormData(e.currentTarget);
    const fio = String(fd.get('fio') || '');
    const phone = String(fd.get('phone') || '');
    const email = String(fd.get('email') || '');
    const comment = String(fd.get('comment') || '');

    const settled: ItemResult[] = [];
    for (const item of items) {
      try {
        const res = await fetch('/api/tickets/order', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: item.eventId, fio, phone, email: email || undefined, date: dateKey(item.startAt), comment,
            items: item.items.map((li) => ({ rateId: li.rateId, qty: li.qty, category: li.category })),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          settled.push({ item, ok: true, number: data.number });
          removeItem(item.eventId);
        } else {
          settled.push({ item, ok: false, error: ORDER_ERROR_RU[String(data.error)] || 'Не удалось оформить' });
        }
      } catch {
        settled.push({ item, ok: false, error: 'Ошибка сети' });
      }
    }
    setResults(settled);
    setStep('result');
  }

  async function goToPayment() {
    const ok = results.filter((r) => r.ok);
    const amount = cartTotal(ok.map((r) => r.item));
    setStep('payment');
    setPayMsg('Переход к оплате…');
    try {
      const res = await fetch('/api/pay', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: ok.map((r) => `${r.item.title} (№${r.number})`).join(', '), amount }),
      });
      const data = await res.json();
      if (data.confirmationUrl) { window.location.href = data.confirmationUrl; return; }
      setPayMsg('Заказ оформлен! Онлайн-оплата пока не подключена — мы свяжемся с вами, чтобы принять оплату, либо оплатите на кассе при посещении.');
    } catch {
      setPayMsg('Заказ оформлен! Не удалось начать онлайн-оплату — мы свяжемся с вами.');
    }
  }

  if (items === null) return null;

  if (items.length === 0 && step === 'form') {
    return (
      <div className="form-card" style={{ textAlign: 'center' }}>
        <p>Корзина пуста.</p>
        <Link href="/tickets" className="btn btn--primary" style={{ marginTop: '1rem' }}>Выбрать сеанс →</Link>
      </div>
    );
  }

  if (step === 'payment') {
    return <div className="form-card" style={{ textAlign: 'center' }}><p>{payMsg}</p></div>;
  }

  if (step === 'result') {
    const allOk = results.every((r) => r.ok);
    const anyOk = results.some((r) => r.ok);
    return (
      <div className="form-card">
        {results.map((r) => (
          <p key={r.item.eventId} className="small" style={{ color: r.ok ? 'var(--forest)' : 'var(--crimson)' }}>
            {r.ok ? `✓ ${r.item.title} — заказ №${r.number} оформлен` : `✗ ${r.item.title} — ${r.error}`}
          </p>
        ))}
        {!allOk && <p className="caption" style={{ marginTop: '0.5rem' }}>Неоформленные позиции остались в корзине — вернитесь и попробуйте снова.</p>}
        {results.some((r) => r.ok && r.item.items.some((li) => li.rateId === 'reduced' && li.qty > 0)) && <ReducedTicketNotice style={{ marginTop: '0.75rem' }} />}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {anyOk && <button type="button" className="btn btn--primary" onClick={goToPayment}>Перейти к оплате</button>}
          {!allOk && <Link href="/tickets/cart" className="btn btn--outline-dark">Вернуться в корзину</Link>}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="form-card">
      <div className="form-group"><label>Имя *</label><input name="fio" required defaultValue={initialName} placeholder="Ваше имя" /></div>
      <div className="form-group"><label>Телефон *</label><input name="phone" type="tel" required defaultValue={initialPhone} placeholder="+7 (___) ___-__-__" /></div>
      <div className="form-group"><label>Email (для чека и билета)</label><input name="email" type="email" defaultValue={initialEmail} placeholder="you@example.com" /></div>
      <div className="form-group"><label>Комментарий</label><textarea name="comment" placeholder="Особые пожелания..." /></div>
      {hasReduced && <ReducedTicketNotice style={{ marginBottom: '1rem' }} />}
      <button type="submit" className="btn btn--primary" disabled={step === 'submitting'} style={{ width: '100%', justifyContent: 'center' }}>
        {step === 'submitting' ? 'Оформляем…' : 'Оформить и перейти к оплате'}
      </button>
    </form>
  );
}
