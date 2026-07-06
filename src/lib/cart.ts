'use client';

// Client-side cart — no server reservation happens here (that stays exactly as
// before, in POST /api/tickets/order at checkout). Shared localStorage key/shape
// with public/site-runtime.js's plain-JS window.addToCart, so the vanilla
// schedule widget and these React pages agree on a format without importing
// each other.
const KEY = 'museum_cart';

export type CartItem = {
  eventId: string;
  title: string;
  startAt: string; // ISO
  endAt: string; // ISO
  priceAdult: number;
  priceChild: number;
  qty: number;
};

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function setCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function updateQty(eventId: string, qty: number): CartItem[] {
  const items = getCart()
    .map((i) => (i.eventId === eventId ? { ...i, qty } : i))
    .filter((i) => i.qty > 0);
  setCart(items);
  return items;
}

export function removeItem(eventId: string): CartItem[] {
  const items = getCart().filter((i) => i.eventId !== eventId);
  setCart(items);
  return items;
}

export function clearCart(): void {
  setCart([]);
}

export function lineTotal(item: CartItem): number {
  return item.priceAdult * item.qty;
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + lineTotal(i), 0);
}
