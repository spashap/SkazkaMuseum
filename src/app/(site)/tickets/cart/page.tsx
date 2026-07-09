'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCart, removeItem, setRateQty, rates, lineTotal, cartTotal, type CartItem } from '@/lib/cart';
import { isReducedRateId } from '@/lib/rates';
import { REDUCED_CATEGORIES } from '@/lib/reducedTickets';
import ReducedTicketNotice from '@/components/site/ReducedTicketNotice';

export default function CartPage() {
  const [items, setItems] = useState<CartItem[] | null>(null);
  const router = useRouter();

  useEffect(() => { setItems(getCart()); }, []);

  function qtyFor(item: CartItem, rateId: string): number {
    return item.items.find((li) => li.rateId === rateId)?.qty ?? 0;
  }
  function categoryFor(item: CartItem, rateId: string): string {
    return item.items.find((li) => li.rateId === rateId)?.category || '';
  }
  function changeQty(eventId: string, rateId: string, qty: number, category?: string) {
    setItems(setRateQty(eventId, rateId, Math.max(0, qty), category));
  }
  function remove(eventId: string) {
    setItems(removeItem(eventId));
  }

  const hasReduced = items?.some((i) => i.items.some((li) => isReducedRateId(li.rateId) && li.qty > 0)) ?? false;
  const missingCategory = items?.some((i) => i.items.some((li) => isReducedRateId(li.rateId) && li.qty > 0 && !li.category)) ?? false;

  return (
    <section className="section container" style={{ maxWidth: 720 }}>
      <div className="section__header text-center">
        <span className="eyebrow">Онлайн-касса</span>
        <h1>Корзина</h1>
      </div>

      {items === null ? null : items.length === 0 ? (
        <div className="form-card" style={{ textAlign: 'center' }}>
          <p>Корзина пуста.</p>
          <Link href="/tickets" className="btn btn--primary" style={{ marginTop: '1rem' }}>Выбрать сеанс →</Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {items.map((item) => {
              const lineRates = rates(item);
              return (
                <div key={item.eventId} className="program-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <strong>{item.title}</strong>
                      <p className="small" style={{ color: 'var(--text-light)', margin: '0.3rem 0 0' }}>
                        {new Date(item.startAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Moscow' })} ·{' '}
                        {new Date(item.startAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' })}–
                        {new Date(item.endAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' })}
                      </p>
                    </div>
                    <button type="button" className="btn btn--outline-dark" style={{ padding: '0.3rem 0.7rem' }} onClick={() => remove(item.eventId)} aria-label="Удалить билет с этого сеанса">✕</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {lineRates.map((rate) => {
                      const qty = qtyFor(item, rate.id);
                      return (
                        <div key={rate.id}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <span className="small" style={{ flex: 1, minWidth: 170 }}>{rate.label} — {rate.unitPrice} ₽</span>
                            <button type="button" className="btn btn--outline-dark" style={{ padding: '0.3rem 0.7rem' }} disabled={qty <= 0}
                              onClick={() => changeQty(item.eventId, rate.id, qty - 1, categoryFor(item, rate.id))} aria-label={`Меньше: ${rate.label}`}>−</button>
                            <span style={{ minWidth: '1.5rem', textAlign: 'center' }}>{qty}</span>
                            <button type="button" className="btn btn--outline-dark" style={{ padding: '0.3rem 0.7rem' }}
                              onClick={() => changeQty(item.eventId, rate.id, qty + 1, categoryFor(item, rate.id))} aria-label={`Больше: ${rate.label}`}>+</button>
                            <span className="small" style={{ minWidth: 110, textAlign: 'right', fontWeight: 700, color: 'var(--crimson)' }}>
                              {qty > 0 ? `${rate.unitPrice} ₽ × ${qty} = ${rate.unitPrice * qty} ₽` : ''}
                            </span>
                          </div>
                          {isReducedRateId(rate.id) && qty > 0 && (
                            <select
                              value={categoryFor(item, rate.id)}
                              onChange={(e) => changeQty(item.eventId, rate.id, qty, e.target.value)}
                              style={{ marginTop: '0.4rem', minWidth: 240 }}
                            >
                              <option value="">Выберите льготную категорию…</option>
                              {REDUCED_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ textAlign: 'right', fontWeight: 700, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '0.6rem' }}>
                    Итого по билету: {lineTotal(item)} ₽
                  </div>
                </div>
              );
            })}
          </div>

          {hasReduced && <ReducedTicketNotice style={{ marginTop: '1rem' }} />}

          <div className="form-card" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Итого: {cartTotal(items)} ₽</span>
            <button type="button" className="btn btn--primary" disabled={missingCategory} onClick={() => router.push('/tickets/checkout')}>Оформить заказ</button>
          </div>
          {missingCategory && (
            <p className="caption" style={{ color: 'var(--crimson)', marginTop: '0.5rem' }}>
              Выберите льготную категорию для отмеченных билетов.
            </p>
          )}
        </>
      )}
    </section>
  );
}
