// Reduced ("льготный") ticket support — the single source for the eligibility rule,
// discount math, the fixed list of benefit categories, and the legal notice text that
// must appear everywhere a reduced ticket can be bought or reviewed. No React/DOM/DB
// imports here so it can be shared by client components, API routes and PDF/email builders.

export const REDUCED_CATEGORIES = [
  'Пенсионеры',
  'Инвалиды',
  'Сопровождающие инвалидов',
  'Многодетные семьи',
  'Участники СВО',
  'Супруги участников СВО',
  'Несовершеннолетние дети участников СВО',
] as const;
export type ReducedCategory = (typeof REDUCED_CATEGORIES)[number];

export function isReducedCategory(value: string): value is ReducedCategory {
  return (REDUCED_CATEGORIES as readonly string[]).includes(value);
}

// Only entrance tickets ('free') and excursions ('excursion') can ever offer a reduced
// price — masterclasses/quests/theatre/lectures never show the option, regardless of
// the per-program `reducedEnabled` flag.
export const REDUCED_ELIGIBLE_TYPES = ['excursion', 'free'] as const;

export function programAllowsReduced(program: { type: string; reducedEnabled: boolean }): boolean {
  return program.reducedEnabled && (REDUCED_ELIGIBLE_TYPES as readonly string[]).includes(program.type);
}

export function reducedUnitPrice(priceAdult: number, discountPercent: number): number {
  return Math.max(0, Math.round(priceAdult * (1 - discountPercent / 100)));
}

export const REDUCED_TICKET_NOTICE =
  'Льготный билет действителен только при предъявлении оригинала документа, подтверждающего право на льготу. ' +
  'Документы проверяются сотрудником музея при входе. При отсутствии подтверждающего документа администрация музея ' +
  'вправе отказать в предоставлении льготы или предложить оплатить разницу до полной стоимости билета.';
