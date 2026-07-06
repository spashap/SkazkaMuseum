import { promises as fs } from 'fs';
import path from 'path';
import { db } from './db';
import { renderExcursionCards, renderQuestCards, renderMasterclassCards, renderBirthdayPackages } from './programCards';

// Each marker is an empty grid container left in the fragment HTML where the hardcoded
// cards used to be; renderFragment splices in the live Program-driven markup (see
// src/lib/programCards.ts) so /admin/programs is the single source of truth.
const CATALOG_MARKERS: [string, () => Promise<string>][] = [
  ['data-program-catalog="excursion"></div>', renderExcursionCards],
  ['data-program-catalog="quest"></div>', renderQuestCards],
  ['data-program-catalog="masterclass"></div>', renderMasterclassCards],
  ['data-program-catalog="birthday"></div>', renderBirthdayPackages],
];

// Loads an extracted HTML fragment (header/footer/page) from the original design and:
//  1. swaps her default (seed) image for an admin-uploaded one where present,
//  2. fixes contact links from CompanySettings,
//  3. marks the page section active so it displays on its own route.
const FRAG_DIR = path.join(process.cwd(), 'src', 'content', 'fragments');
const cache = new Map<string, string>();

export async function readFragment(name: string): Promise<string> {
  if (cache.has(name)) return cache.get(name)!;
  try {
    const html = await fs.readFile(path.join(FRAG_DIR, `${name}.html`), 'utf8');
    if (process.env.NODE_ENV === 'production') cache.set(name, html);
    return html;
  } catch {
    return '';
  }
}

export async function renderFragment(name: string): Promise<string> {
  let html = await readFragment(name);
  if (!html) return '';

  // 1. image overrides: replace seed path with uploaded optimized image when set
  const slots = await db.imageSlot.findMany({ where: { NOT: { webpPath: '' } } });
  for (const s of slots) {
    if (s.seedPath && s.webpPath) html = html.split(s.seedPath).join(s.webpPath);
  }

  // 2. contact links from settings (her prototype had placeholder contacts)
  const c = await db.companySettings.findUnique({ where: { id: 1 } });
  if (c) {
    const telDigits = c.phone.replace(/[^+\d]/g, '');
    const repl: [string, string][] = [
      ['tel:+78121234567', `tel:${telDigits}`],
      ['tel:+79213638305', `tel:${telDigits}`],
      ['https://t.me/museum_skazki', c.telegram],
      ['https://t.me/skazkamuseum', c.telegram],
      ['https://max.ru/chat/skazkamuseum', c.maxLink],
      ['info@skazkamuseum.ru', c.email],
    ];
    for (const [from, to] of repl) html = html.split(from).join(to);
  }

  // 3. ensure the page section is visible on its own route
  html = html.replace('class="page-section"', 'class="page-section active"');

  // 4. splice in live Program-driven cards where a catalog marker is present
  for (const [marker, renderer] of CATALOG_MARKERS) {
    if (html.includes(marker)) {
      const cardsHtml = await renderer();
      html = html.replace(marker, marker.replace('></div>', `>${cardsHtml}</div>`));
    }
  }
  return html;
}
