import { db } from './db';

// Renders the card-grid markup for each public program page directly from the `Program`
// table (admin-managed), reusing the same CSS classes the original hand-authored fragment
// used — so /admin/programs is the single source of truth for these pages (see
// src/content/fragments/{tours,kvesty,masterclasses,birthday}.html for the marker divs
// this content gets spliced into, via renderFragment in src/lib/fragments.ts).
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cover(images: string): string | null {
  try {
    return (JSON.parse(images || '[]')[0] as string | undefined) ?? null;
  } catch {
    return null;
  }
}

async function activePrograms(type: string) {
  return db.program.findMany({ where: { type, status: 'active' }, orderBy: { createdAt: 'asc' }, include: { upsells: true } });
}

export async function renderExcursionCards(): Promise<string> {
  const programs = await activePrograms('excursion');
  return programs
    .map((p) => {
      const img = cover(p.images);
      return `<div class="program-card" style="overflow:hidden;padding:0;display:flex;flex-direction:column;">
        ${img ? `<img loading="lazy" decoding="async" src="${esc(img)}" alt="${esc(p.title)}" style="width:100%;height:200px;object-fit:cover;display:block;">` : ''}
        <div style="padding:1.5rem;display:flex;flex-direction:column;flex:1;">
          <h3 style="font-size:1.15rem;margin-bottom:0.5rem;text-align:center;">${esc(p.title)}</h3>
          <div class="program-card__meta" style="justify-content:center;">
            ${p.ageLimit ? `<span class="program-card__tag">🎒 ${esc(p.ageLimit)}</span>` : ''}
            <span class="program-card__tag">⏱ ${p.durationMin} мин</span>
            <span class="program-card__tag">👥 до ${p.maxGroup}</span>
          </div>
          <p style="font-size:0.85rem;color:var(--text-light);margin:0.6rem 0 0.5rem;">${esc(p.shortDesc)}</p>
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(0,0,0,0.08);padding-top:1rem;margin-top:auto;">
            <span style="font-weight:700;color:var(--crimson);">${p.priceAdult ? `${p.priceAdult} ₽` : 'по запросу'}<span style="font-size:0.75rem;font-weight:400;color:var(--text-light);"> / взросл.</span></span>
            ${p.priceChild ? `<span style="font-size:0.85rem;color:var(--text-light);">${p.priceChild} ₽ / дет.</span>` : ''}
          </div>
          <button class="btn btn--outline-dark" onclick="showForm('tour-form')" style="margin-top:1rem;">Забронировать</button>
        </div>
      </div>`;
    })
    .join('');
}

export async function renderQuestCards(): Promise<string> {
  const programs = await activePrograms('quest');
  return programs
    .map((p) => {
      const img = cover(p.images);
      return `<div style="background:var(--cream);border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);display:flex;flex-direction:column;">
        <div style="padding:0;background:none;overflow:hidden;height:200px;position:relative;">
          ${img ? `<img loading="lazy" decoding="async" src="${esc(img)}" alt="${esc(p.title)}" style="width:100%;height:100%;object-fit:cover;display:block;">` : ''}
          ${p.ageLimit ? `<div style="position:absolute;top:1rem;left:1rem;background:var(--forest);color:#fff;font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:0.25rem 0.7rem;border-radius:20px;">${esc(p.ageLimit)}</div>` : ''}
        </div>
        <div style="padding:1.5rem;display:flex;flex-direction:column;flex:1;">
          <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:700;margin-bottom:0.7rem;color:var(--dark);">${esc(p.title)}</h3>
          <p style="font-size:0.9rem;color:var(--text-light);line-height:1.6;margin-bottom:1rem;">${esc(p.shortDesc)}</p>
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(0,0,0,0.08);padding-top:1rem;margin-top:auto;">
            <span style="font-weight:700;color:var(--crimson);">${p.priceAdult ? `${p.priceAdult} ₽` : 'по запросу'}<span style="font-size:0.75rem;font-weight:400;color:var(--text-light);"> / чел.</span></span>
            ${p.ageLimit ? `<span style="font-size:0.78rem;color:var(--text-light);">${esc(p.ageLimit)}</span>` : ''}
          </div>
        </div>
      </div>`;
    })
    .join('');
}

export async function renderMasterclassCards(): Promise<string> {
  const programs = await activePrograms('masterclass');
  return programs
    .map((p) => {
      const img = cover(p.images);
      return `<div class="catalog-card">
        <div class="catalog-card__img" style="padding:0;background:none;overflow:hidden;">${img ? `<img loading="lazy" decoding="async" src="${esc(img)}" alt="${esc(p.title)}" style="width:100%;height:100%;object-fit:cover;display:block;">` : ''}</div>
        <div class="catalog-card__body">
          <div class="catalog-card__title">${esc(p.title)}</div>
          <p>${esc(p.shortDesc)}</p>
          <div class="catalog-card__footer">
            <span class="catalog-card__price">${p.priceAdult ? `${p.priceAdult} ₽` : 'по запросу'}</span>
            ${p.ageLimit ? `<span class="catalog-card__age">${esc(p.ageLimit)}</span>` : ''}
          </div>
        </div>
      </div>`;
    })
    .join('');
}

export async function renderBirthdayPackages(): Promise<string> {
  const programs = await activePrograms('birthday');
  return programs
    .map((p, i) => {
      const features = p.fullDesc.split('\n').filter(Boolean);
      return `<div class="package-card${i === 0 ? ' featured' : ''}">
        <div class="package-card__header">
          <div class="package-card__title">✨ ${esc(p.title)}</div>
          <div class="package-card__price">${p.priceGroup ? `${p.priceGroup} ₽` : p.priceAdult ? `${p.priceAdult} ₽` : 'по запросу'}</div>
          ${p.shortDesc ? `<div style="font-size:0.85rem;opacity:0.8;margin-top:0.25rem;">${esc(p.shortDesc)}</div>` : ''}
        </div>
        <div class="package-card__body">
          <ul class="package-card__features">
            ${features.map((f) => `<li class="package-card__feature">${esc(f)}</li>`).join('')}
          </ul>
          ${p.upsells.length > 0 ? `<div style="font-size:0.82rem;color:var(--text-light);margin-bottom:1rem;"><strong>Дополнения:</strong> ${p.upsells.map((u) => `${esc(u.title)} (${u.price} ₽)`).join(', ')}</div>` : ''}
          <button class="btn btn--primary" onclick="showForm('birthday-form')" style="margin-top:auto;">Забронировать →</button>
        </div>
      </div>`;
    })
    .join('');
}
