# HANDOFF — Museum of Russian Fairy Tales (for Claude Code)

Read this first, then `../CLAUDE.md` and `../PLAN.md`. This file orients you fast so you can
continue the build. The site is Russian; keep ALL user-facing text (site, admin, SEO, emails) in Russian.

## 1. What this project is

One Next.js (App Router, TypeScript) app that is BOTH:
- the **public museum website** (`src/app/(site)/**`) — a full-fidelity port of the CEO's original
  single-file HTML design, 14 pages, and
- the **staff admin panel / CRM** (`src/app/admin/**`) — login + roles, bookings, clients, content.

Backed by **SQLite + Prisma**. Deployed on a Fornex VPS under **PM2 + nginx + certbot**, next to other sites.
Repo: https://github.com/spashap/SkazkaMuseum (branch `main`).

The CEO is non-technical and will maintain this with her own Claude Code. Optimize for
"hard to destroy, easy to change": strong conventions, typed schema, one place to change each thing.

## 2. Run it locally (Windows, no terminal needed for the CEO)

- `install.bat` — one-time: installs Node if missing, `npm install`, creates `.env` (random AUTH_SECRET),
  `npm run setup` (prisma generate + db push + seed).
- `start.bat` — runs `npm run dev` and opens http://localhost:3100.
- `PullFromGit.bat` — installs Git if missing, hard-resets to `origin/main`, reinstalls, db push.
  (Her data — `.env`, DB, uploads — is gitignored, so pulls never wipe it.)

Developer equivalents: `npm install` → `npm run setup` → `npm run dev`.
Admin: http://localhost:3100/login — `admin@skazkamuseum.ru` / `muzei-admin-2026` (change in Users).

## 3. Architecture you must respect (golden rules)

1. **Single CSS control.** All fonts/sizes/colors are CSS variables from ONE `Theme` DB row
   (`src/lib/theme.ts` → injected as `:root{...}` in `src/app/layout.tsx`). Never hardcode a hex,
   font, or px size in a component — add/point to a token. Admin "Дизайн" edits the Theme row.
2. **Constrained scale:** 3 font families, 7 sizes (`--fs-hero-xl … --fs-caption`), 3 weights.
3. **Images = slots.** Every image is an `ImageSlot` (DB row) with a `/seed/<id>.webp` default
   shipped in the repo; admin uploads a replacement (optimized by `sharp`). Never inline base64.
4. **Content is data.** Public page copy lives in `src/content/fragments/*.html` (see §5).
   Company facts → `CompanySettings`; SEO meta → `PageContent`. Both admin-editable.
5. **Secrets only in `.env` on the server.** Integrations no-op when keys are missing, so the app
   always runs. Never commit `.env`.
6. **Roles gate access.** `getSession()` + `canAccess(role, section)` from `src/lib/auth.ts` in every
   admin page and protected API route. Permissions defined once in `SECTION_ACCESS`.
   Roles: ADMIN (all) · MANAGER (bookings/clients/events/leads, no finance/users) · CASHIER (tickets + schedule).

## 4. Repo map

```
src/app/(site)/           public site: layout renders her header+footer fragments + JS; routes render page fragments
src/app/(site)/[page]/    the 13 non-home pages (dynamic); home is (site)/page.tsx
src/app/admin/            admin sections (dashboard, zayavki, bookings, clients, calendar, programs,
                          finance, analytics, promo, users, design, images, settings) + login
src/app/api/              leads, pay, images/upload, auth/{login,logout}
src/lib/                  db.ts, auth.ts, theme.ts, fragments.ts, images.ts, integrations/{yookassa,unisender,telegram}.ts
src/components/           site/* and admin/*
src/content/fragments/    her extracted page HTML (home/tickets/.../skazki + header/footer)
src/content/slots.json    image-slot manifest (seed for DB)
public/seed/<id>.webp     default images (committed); public/site-runtime.js + site-overrides.js
prisma/schema.prisma      data model; prisma/seed.mjs seeds theme, settings, admin, pages, slots, sample programs
```

## 5. How the public site works (important — it's a fidelity port)

Her original prototype is `projectSpec/muzeyskazki_v3_final_244.html` (a vanilla-JS SPA).
`scripts/extract-original.mjs` split it into:
- `src/content/fragments/*.html` — verbatim page HTML (+ header/footer). Base64 images replaced by
  `/seed/<slot>.webp` refs; every `<img>` gets `loading="lazy"`.
- `src/app/(site)/site.css` — her CSS with `:root` and inline `<style>` removed (tokens injected).
  Imported only in `(site)/layout.tsx`, so it never affects the admin panel.
- `public/site-runtime.js` — her JS (calendar, FAQ, mobile nav).
- `public/site-overrides.js` — our overrides: `showPage()` → real route navigation; site forms → `POST /api/leads`.

At request time `src/lib/fragments.ts` (1) replaces a slot's seed image with an admin-uploaded one
when present, (2) fixes contact links from `CompanySettings`, (3) marks the page `active`. Pages
render the fragment with `dangerouslySetInnerHTML`.

- **Edit page text:** edit `src/content/fragments/<page>.html`.
- **Re-extract from a new prototype:** re-run `node scripts/extract-original.mjs` (needs `sharp`).
- **Change an image:** admin → «Изображения» (never edit base64 / add raw `<img>`).

## 6. Integrations (stubs — go live when `.env` keys are set)

`src/lib/integrations/*`: **yookassa** (payments, `/api/pay`), **unisender** (UniSender GO v2 email),
**telegram** (new-lead alerts). Each logs "not configured" and no-ops without keys. See `.env.example`.
Also: Yandex Maps iframe on `/contacts`; Yandex Metrica counter id in `CompanySettings`.

## 7. Deploy (Fornex VPS)

`release.bat "msg"` (push to GitHub) → `deploy-remote.bat` (SSH → `deploy.sh`: pull, `npm install`,
`prisma db push`, `npm run build`, `pm2 restart skazkamuseum`). App on `127.0.0.1:3100`; nginx config
in `deploy/nginx-skazkamuseum.conf`; Node 22 via nvm; SSL via certbot. Schema changes use `db push`
(no migrations) — additive changes are safe; destructive ones can drop data (back up `prisma/prod.db`).
DNS for skazkamuseum.ru is not yet pointed at the server.

## 8. Status & what to build next (see PLAN.md for detail)

DONE (Phase 1–3): deploy pipeline, tokens/Design page, DB + auth + roles, full public site (14 pages,
WebP+lazy images, admin-controlled), image-slot manager, Settings, Users, site forms → «Заявки»
(convert lead → booking + client), Telegram-notify hook.

NEXT (scaffolded with placeholders — each admin page names its phase):
- Phase 4: Bookings pipeline UI (status transitions, booking card), Clients CRM depth, Calendar (month/week/day, drag&drop, capacity).
- Phase 5: Programs/catalog editor + upsells CRUD.
- Phase 6: YooKassa live payment flow + PDF/QR e-tickets to email.
- Phase 7: Finance (breakdowns, Excel export), Analytics (popular programs, heatmap, conversion), Promo/Certificates.
- Phase 8: UniSender email flows (confirmations, 24h reminders, segmented mailings), Metrica, hardening.

## 9. Conventions & gotchas

- Prefer server components; add `'use client'` only for interactivity.
- Reuse primitives in `globals.css` (`.btn`, `.card`, `.grid`, `.field`, `.container`) and tokens.
- SQLite note: `autoincrement()` only on `@id`. `Booking.number` is assigned in app code (see `admin/zayavki`).
- After schema edits: `npm run db:push` then `npm run db:seed` if slots/pages changed.
- `.bat` files are ASCII-only on purpose (Windows .bat corrupts on Cyrillic).
- Keep the CEO's design intact — she is the boss on visuals; match `muzeyskazki_v3_final_244.html`.
