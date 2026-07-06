'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCart, updateQty, removeItem, cartTotal, lineTotal, type CartItem } from '@/lib/cart';

export default function CartPage() {
  const [items, setItems] = useState<CartItem[] | null>(null);
  const router = useRouter();

  useEffect(() => { setItems(getCart()); }, []);

  function changeQty(eventId: string, qty: number) {
    setItems(updateQty(eventId, qty));
  }
  function remove(eventId: string) {
    setItems(removeItem(eventId));
  }

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
            {items.map((item) => (
              <div key={item.eventId} className="program-card" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <strong>{item.title}</strong>
                  <p className="small" style={{ color: 'var(--text-light)', margin: '0.3rem 0' }}>
                    {new Date(item.startAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })} ·{' '}
                    {new Date(item.startAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}–
                    {new Date(item.endAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="small" style={{ color: 'var(--text-light)' }}>{item.priceAdult} ₽ / билет</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button type="button" className="btn btn--outline-dark" style={{ padding: '0.3rem 0.7rem' }} disabled={item.qty <= 1}
                    onClick={() => changeQty(item.eventId, item.qty - 1)}>−</button>
                  <span style={{ minWidth: '1.5rem', textAlign: 'center' }}>{item.qty}</span>
                  <button type="button" className="btn btn--outline-dark" style={{ padding: '0.3rem 0.7rem' }}
                    onClick={() => changeQty(item.eventId, item.qty + 1)}>+</button>
                </div>
                <div style={{ minWidth: 90, textAlign: 'right', fontWeight: 700, color: 'var(--crimson)' }}>{lineTotal(item)} ₽</div>
                <button type="button" className="btn btn--outline-dark" style={{ padding: '0.3rem 0.7rem' }} onClick={() => remove(item.eventId)} aria-label="Удалить">✕</button>
              </div>
            ))}
          </div>

          <div className="form-card" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Итого: {cartTotal(items)} ₽</span>
            <button type="button" className="btn btn--primary" onClick={() => router.push('/tickets/checkout')}>Оформить заказ</button>
          </div>
        </>
      )}
    </section>
  );
}
