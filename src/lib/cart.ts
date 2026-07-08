'use client';

import { sessionRates, findRate, type Rate } from './rates';

// Client-side cart — no server reservation happens here (that stays exactly as
// before, in POST /api/tickets/order at checkout). Shared localStorage key/shape
// with public/site-runtime.js's plain-JS window.addToCart, so the vanilla
// schedule widget and these React pages agree on a format without importing
// each other.
const KEY = 'museum_cart';

// One entry per rate purchased on this session — e.g. [{rateId:'adult',qty:2},
// {rateId:'child',qty:1},{rateId:'reduced',qty:1,category:'Пенсионеры'}]. `category`
// only applies to the 'reduced' rate today; other future rates can ignore it.
export type CartLineItem = { rateId: string; qty: number; category?: string };

export type CartItem = {
  eventId: string;
  title: string;
  startAt: string; // ISO
  endAt: string; // ISO
  priceAdult: number;
  priceChild: number;
  // Snapshot of the session's rate-eligibility fields at add-to-cart time — feeds
  // sessionRates() so the cart/checkout UI can list rates without re-fetching.
  programType?: string;
  reducedEnabled?: boolean;
  reducedPercent?: number;
  items: CartLineItem[];
};

// Carts written before per-rate quantities existed stored a single
// `{ qty, ticketType, reducedCategory }` per line — normalize on read so a cart
// started before a deploy keeps working instead of appearing empty/broken.
type LegacyCartItem = CartItem & { qty?: number; ticketType?: 'regular' | 'reduced'; reducedCategory?: string };
function normalize(raw: LegacyCartItem): CartItem {
  if (Array.isArray(raw.items)) return raw;
  const qty = raw.qty || 1;
  const items: CartLineItem[] =
    raw.ticketType === 'reduced'
      ? [{ rateId: 'reduced', qty, category: raw.reducedCategory || '' }]
      : [{ rateId: 'adult', qty }];
  return { ...raw, items };
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as LegacyCartItem[]) : [];
    return parsed.map(normalize);
  } catch {
    return [];
  }
}

export function setCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function removeItem(eventId: string): CartItem[] {
  const items = getCart().filter((i) => i.eventId !== eventId);
  setCart(items);
  return items;
}

export function clearCart(): void {
  setCart([]);
}

// Sets the quantity of one rate on one session's cart line (e.g. "child" tickets for
// event X) — creates the line if needed, drops the rate entry at qty 0, and drops the
// whole line once every rate on it is 0 (mirrors the old behavior of removing a line
// decremented to nothing).
export function setRateQty(eventId: string, rateId: string, qty: number, category?: string): CartItem[] {
  const items = getCart();
  const idx = items.findIndex((i) => i.eventId === eventId);
  if (idx === -1) return items;
  const line = items[idx];
  const rest = line.items.filter((li) => li.rateId !== rateId);
  const nextLineItems = qty > 0 ? [...rest, { rateId, qty, category }] : rest;
  const next =
    nextLineItems.length > 0
      ? items.map((i, j) => (j === idx ? { ...line, items: nextLineItems } : i))
      : items.filter((_, j) => j !== idx);
  setCart(next);
  return next;
}

export function rates(item: CartItem): Rate[] {
  return sessionRates({
    priceAdult: item.priceAdult,
    priceChild: item.priceChild,
    type: item.programType,
    reducedEnabled: item.reducedEnabled,
    reducedDiscountPercent: item.reducedPercent,
  });
}

export function lineItemTotal(item: CartItem, li: CartLineItem): number {
  return (findRate(rates(item), li.rateId)?.unitPrice ?? 0) * li.qty;
}

export function lineQty(item: CartItem): number {
  return item.items.reduce((sum, li) => sum + li.qty, 0);
}

export function lineTotal(item: CartItem): number {
  return item.items.reduce((sum, li) => sum + lineItemTotal(item, li), 0);
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + lineTotal(i), 0);
}
