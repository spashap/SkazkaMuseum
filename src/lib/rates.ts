import { programAllowsReduced, reducedUnitPrice } from './reducedTickets';

export type Rate = { id: string; label: string; unitPrice: number };

// The list of purchasable ticket rates for one session — built from the session's own
// price/eligibility fields rather than "adult" and "child" being two separate hardcoded
// code paths. The cart, checkout form and order API all iterate this list instead of
// naming ticket types directly, so a future rate (a reduced child price, a family rate,
// anything) is one more entry here and nothing else in the purchase pipeline changes.
export function sessionRates(s: {
  priceAdult: number;
  priceChild: number;
  type?: string;
  reducedEnabled?: boolean;
  reducedDiscountPercent?: number;
}): Rate[] {
  const rates: Rate[] = [{ id: 'adult', label: 'Взрослый билет', unitPrice: s.priceAdult }];
  if (s.priceChild > 0) rates.push({ id: 'child', label: 'Детский билет', unitPrice: s.priceChild });
  if (programAllowsReduced({ type: s.type || '', reducedEnabled: !!s.reducedEnabled })) {
    const pct = s.reducedDiscountPercent ?? 30;
    // Each reduced rate discounts off its own category's base price — a льготный
    // взрослый билет is -30% of priceAdult, a льготный детский билет is -30% of
    // priceChild, never both derived from the adult price.
    rates.push({ id: 'reduced_adult', label: `Льготный взрослый билет (−${pct}%)`, unitPrice: reducedUnitPrice(s.priceAdult, pct) });
    if (s.priceChild > 0) {
      rates.push({ id: 'reduced_child', label: `Льготный детский билет (−${pct}%)`, unitPrice: reducedUnitPrice(s.priceChild, pct) });
    }
  }
  return rates;
}

export function findRate(rates: Rate[], id: string): Rate | undefined {
  return rates.find((r) => r.id === id);
}

export function isReducedRateId(id: string): boolean {
  return id === 'reduced_adult' || id === 'reduced_child';
}
