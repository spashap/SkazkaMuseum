'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getCart, removeItem, cartTotal, type CartItem } from '@/lib/cart';
import { isReducedRateId } from '@/lib/rates';
import ReducedTicketNotice from './ReducedTicketNotice';

// Sessions are always in Moscow time — extract the calendar date against that
// timezone explicitly, so a buyer's own device timezone can't shift it to the
// next/previous day near midnight.
const dateKeyFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Moscow' });
function dateKey(iso: string): string {
  return dateKeyFmt.format(new Date(iso));
}

type ItemResult = { item: CartItem; ok: boolean; number?: number; bookingId?: string; error?: string };
type Step = 'form' | 'submitting' | 'result';
// The YooKassa embedded widget lives in a modal over the result view, so the
// whole payment happens in a popup — no redirects, no page jumps.
type PayState = 'idle' | 'starting' | 'widget' | 'paid' | 'canceled' | 'failed';

const ORDER_ERROR_RU: Record<string, string> = {
  sold_out: 'Мест не осталось',
  invalid_rate: 'Этот тариф недоступен для данной программы',
  invalid_reduced_category: 'Не выбрана льготная категория',
};

declare global {
  interface Window {
    YooMoneyCheckoutWidget?: new (config: {
      confirmation_token: string;
      return_url?: string;
      error_callback?: (error: { error: string }) => void;
    }) => { render: (containerId: string) => Promise<void>; destroy: () => void };
  }
}

function loadWidgetScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.YooMoneyCheckoutWidget) return resolve();
    const s = document.createElement('script');
    s.src = 'https://yookassa.ru/checkout-widget/v1/checkout-widget.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('widget script failed'));
    document.body.appendChild(s);
  });
}

export default function CheckoutForm({ initialName, initialPhone, initialEmail }: { initialName?: string; initialPhone?: string; initialEmail?: string }) {
  const [items, setItems] = useState<CartItem[] | null>(null);
  const [step, setStep] = useState<Step>('form');
  const [results, setResults] = useState<ItemResult[]>([]);
  const [buyerEmail, setBuyerEmail] = useState('');
  const [payState, setPayState] = useState<PayState>('idle');
  const [payMsg, setPayMsg] = useState('');
  const widgetRef = useRef<{ destroy: () => void } | null>(null);
  const pollingRef = useRef(false);

  useEffect(() => { setItems(getCart()); }, []);
  useEffect(() => () => { pollingRef.current = false; widgetRef.current?.destroy(); }, []);

  const hasReduced = items?.some((i) => i.items.some((li) => isReducedRateId(li.rateId) && li.qty > 0)) ?? false;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!items || items.length === 0) return;
    setStep('submitting');
    const fd = new FormData(e.currentTarget);
    const fio = String(fd.get('fio') || '');
    const phone = String(fd.get('phone') || '');
    const email = String(fd.get('email') || '');
    const comment = String(fd.get('comment') || '');
    setBuyerEmail(email);

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
          settled.push({ item, ok: true, number: data.number, bookingId: data.bookingId });
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

  function closeModal() {
    pollingRef.current = false;
    widgetRef.current?.destroy();
    widgetRef.current = null;
    setPayState('idle');
  }

  async function pollStatus(paymentId: string) {
    pollingRef.current = true;
    // ~7.5 minutes at 2.5s — enough for СБП/3-DS round trips inside the widget.
    for (let i = 0; i < 180 && pollingRef.current; i++) {
      await new Promise((r) => setTimeout(r, 2500));
      if (!pollingRef.current) return;
      try {
        const res = await fetch('/api/pay/status', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.status === 'paid') {
          pollingRef.current = false;
          widgetRef.current?.destroy();
          widgetRef.current = null;
          setPayState('paid');
          return;
        }
        if (data.status === 'canceled') {
          pollingRef.current = false;
          widgetRef.current?.destroy();
          widgetRef.current = null;
          setPayState('canceled');
          return;
        }
      } catch { /* network blip — keep polling */ }
    }
    if (pollingRef.current) {
      setPayMsg('Время ожидания оплаты истекло. Если вы завершили оплату — билет придёт на почту; иначе попробуйте ещё раз.');
      setPayState('failed');
    }
  }

  async function goToPayment() {
    const ok = results.filter((r) => r.ok && r.bookingId);
    if (ok.length === 0) return;
    setPayState('starting');
    setPayMsg('');
    try {
      const res = await fetch('/api/pay', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingIds: ok.map((r) => r.bookingId), email: buyerEmail || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.confirmationToken) {
        setPayMsg('Заказ оформлен! Онлайн-оплата сейчас недоступна — мы свяжемся с вами, чтобы принять оплату, либо оплатите на кассе при посещении.');
        setPayState('failed');
        return;
      }
      await loadWidgetScript();
      if (!window.YooMoneyCheckoutWidget) throw new Error('no widget');
      setPayState('widget');
      // The container div renders with the 'widget' state — give React a tick.
      setTimeout(async () => {
        try {
          const widget = new window.YooMoneyCheckoutWidget!({
            confirmation_token: data.confirmationToken,
            return_url: window.location.href,
            error_callback: () => {
              setPayMsg('Не удалось загрузить платёжную форму. Попробуйте ещё раз.');
              setPayState('failed');
            },
          });
          widgetRef.current = widget;
          await widget.render('yk-widget');
          pollStatus(data.paymentId);
        } catch {
          setPayMsg('Не удалось загрузить платёжную форму. Попробуйте ещё раз.');
          setPayState('failed');
        }
      }, 50);
    } catch {
      setPayMsg('Не удалось начать оплату. Проверьте соединение и попробуйте ещё раз.');
      setPayState('failed');
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

  if (step === 'result') {
    const allOk = results.every((r) => r.ok);
    const anyOk = results.some((r) => r.ok);
    return (
      <>
        <div className="form-card">
          {results.map((r) => (
            <p key={r.item.eventId} className="small" style={{ color: r.ok ? 'var(--forest)' : 'var(--crimson)' }}>
              {r.ok ? `✓ ${r.item.title} — заказ №${r.number} оформлен` : `✗ ${r.item.title} — ${r.error}`}
            </p>
          ))}
          {!allOk && <p className="caption" style={{ marginTop: '0.5rem' }}>Неоформленные позиции остались в корзине — вернитесь и попробуйте снова.</p>}
          {results.some((r) => r.ok && r.item.items.some((li) => isReducedRateId(li.rateId) && li.qty > 0)) && <ReducedTicketNotice style={{ marginTop: '0.75rem' }} />}
          {payState === 'paid' ? (
            <p style={{ color: 'var(--forest)', fontWeight: 'var(--fw-semibold)' as never, marginTop: '1rem' }}>
              ✓ Оплата прошла успешно! Билет отправлен на почту{buyerEmail ? ` (${buyerEmail})` : ''}, чек придёт отдельным письмом от ЮKassa.
            </p>
          ) : (
            <>
              {payState === 'canceled' && <p className="small" style={{ color: 'var(--crimson)', marginTop: '0.5rem' }}>Оплата не была завершена. Попробуйте ещё раз.</p>}
              {payState === 'failed' && payMsg && <p className="small" style={{ marginTop: '0.5rem' }}>{payMsg}</p>}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                {anyOk && (
                  <button type="button" className="btn btn--primary" onClick={goToPayment} disabled={payState === 'starting'}>
                    {payState === 'starting' ? 'Готовим оплату…' : payState === 'canceled' || payState === 'failed' ? 'Оплатить ещё раз' : 'Перейти к оплате'}
                  </button>
                )}
                {!allOk && <Link href="/tickets/cart" className="btn btn--outline-dark">Вернуться в корзину</Link>}
              </div>
            </>
          )}
        </div>

        {(payState === 'widget' || payState === 'starting') && (
          <div className="pay-modal" role="dialog" aria-modal="true" aria-label="Оплата заказа">
            <div className="pay-modal__card">
              <button type="button" className="pay-modal__close" aria-label="Закрыть" onClick={closeModal}>×</button>
              <p className="small" style={{ marginBottom: '0.75rem' }}>
                Сумма к оплате: <strong>{cartTotal(results.filter((r) => r.ok).map((r) => r.item))} ₽</strong>
              </p>
              {payState === 'starting' && <p className="small">Загрузка платёжной формы…</p>}
              <div id="yk-widget" />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <form onSubmit={submit} className="form-card">
      <div className="form-group"><label>Имя *</label><input name="fio" required defaultValue={initialName} placeholder="Ваше имя" /></div>
      <div className="form-group"><label>Телефон *</label><input name="phone" type="tel" required defaultValue={initialPhone} placeholder="+7 (___) ___-__-__" /></div>
      <div className="form-group"><label>Email (для билета) *</label><input name="email" type="email" required defaultValue={initialEmail} placeholder="you@example.com" /></div>
      <div className="form-group"><label>Комментарий</label><textarea name="comment" placeholder="Особые пожелания..." /></div>
      {hasReduced && <ReducedTicketNotice style={{ marginBottom: '1rem' }} />}
      <button type="submit" className="btn btn--primary" disabled={step === 'submitting'} style={{ width: '100%', justifyContent: 'center' }}>
        {step === 'submitting' ? 'Оформляем…' : 'Оформить и перейти к оплате'}
      </button>
    </form>
  );
}
