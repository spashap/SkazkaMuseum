# Музей русской сказки «За лесами, за горами» — План реализации

> Design + implementation plan. Owner: Pavel. CEO/client maintains later via Claude Code.
> Status: living document. Update as phases complete.

## 1. Goal

Turn the CEO's single-file HTML prototype into a maintainable, deployed product:
a public marketing site (14 pages) + an admin panel (CRM / bookings / content) that
a non-programmer can run and extend with Claude Code, deployed on the existing
Fornex VPS next to the other sites.

Guiding principles:
- **Single CSS control.** One design-token set drives the whole site. No block styles
  itself; everything reads tokens. Admin "Design" page edits the tokens → whole site changes.
- **Hard to destroy, easy to maintain.** One repo, one language (TypeScript), typed DB
  schema (Prisma), strong conventions, bulletproof CLAUDE.md, one-click deploy.
- **Fast to deploy.** Ship a running foundation early; fill unknowns with clearly-marked
  placeholders (secrets, payment keys, real photos) later via the admin panel and `.env`.
- **Keep her design.** The look is recreated faithfully; the CEO is the boss on visuals.

## 2. Stack (locked)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Public site + admin + API in one repo, one language, SSR for Yandex SEO, built-in lazy images |
| Database | **SQLite + Prisma** | Matches the other Fornex sites; one-file backup; typed, migration-safe. Easy upgrade to Postgres later (Prisma config change) |
| Images | **sharp** | On-upload optimization → WebP/AVIF + responsive sizes + blur placeholder |
| Auth | **bcrypt + JWT session (jose)** | 3 roles: Administrator / Manager / Cashier |
| Email | **UniSender GO v2 API** (stub → live via `.env`) | Supported in RU. Sender `spb@skazka-museum.ru` |
| Payments | **YooKassa** (stub → live via `.env`) | Cards, СБП, auto-fiscalization 54-ФЗ |
| Notify | **Telegram Bot API** (stub → live via `.env`) | New-lead alerts to managers |
| Maps | **Yandex Maps iframe** | Contacts page, no API key |
| Analytics | **Yandex Metrica** (placeholder counter) | Web analytics |
| Runtime | **Node 22 LTS via nvm + PM2** | Copies the existing `shepotzvezd` pattern exactly |
| Proxy/SSL | **existing nginx + certbot** | New server block → `127.0.0.1:PORT`; Let's Encrypt cert for skazkamuseum.ru |

## 3. Server fit (Fornex, Ubuntu 24.04)

- App runs under **PM2** as process `skazkamuseum`, bound to `127.0.0.1:3100` (nginx proxies).
- No Docker, no Postgres — matches the current manual stack.
- nginx: new `sites-available/skazkamuseum.ru` (80 → 301 https; 443 → proxy to `:3100`).
- SSL: `certbot --nginx -d skazkamuseum.ru -d www.skazkamuseum.ru`.
- Secrets: root-owned `.env` in project root (like golosrisunka).
- Reboot safety: `pm2 save && pm2 startup` (hardens all PM2 sites).
- Deploy: `release.bat` (push to GitHub) → `deploy-remote.bat` (SSH → `deploy.sh`:
  `git pull && npm install && npm run build && pm2 restart skazkamuseum`).
- Repo: https://github.com/spashap/SkazkaMuseum

## 4. Design tokens (extracted from her HTML, collapsed to rules)

She already had `:root` variables but ~half the code bypassed them and the scale sprawled
(40+ font sizes, 6 weights, ~25 colors). Locked set:

**Fonts (4 → 3):**
- `--font-display` — Ruslan Display (headings, hero)
- `--font-serif` — Cormorant Garamond (serif accents, quotes)
- `--font-body` — Manrope (body). *Underdog dropped (4 uses, redundant).*

**Type scale (40+ → 7):** heroXL `clamp(2.2rem,6vw,3.8rem)` · h1 `clamp(1.6rem,4vw,2.4rem)`
· h2 `1.5rem` · h3 `1.2rem` · body `1rem` · small `0.85rem` · caption `0.75rem`.

**Weights (6 → 3):** 400 / 600 / 700.

**Colors (her palette, kept exactly):** gold `#C8963E`, gold-light `#E8B96A`,
crimson `#8B1A2F`, crimson-dark `#5C1020`, forest `#2C4A2E`, cream `#FBF5E6`,
dark `#1A1209`, text `#2D2416`, text-light `#6B5D45`, white `#FFFFFF`.
Off-palette strays map to the nearest token.

**Other:** radius `12px`, shadow / shadow-lg, transition `0.3s ease`.

All of these live in one `theme` DB row, rendered as `:root { --... }` at page root and
edited from the admin **Design** page. Components use **only** these variables.

## 5. Data model (Prisma / SQLite)

- `User` — email, passwordHash, role (ADMIN|MANAGER|CASHIER), status, action log.
- `Theme` — the token set (fonts, sizes, colors) — one active row.
- `CompanySettings` — address, phones, emails, socials, map coords, Metrica id, etc.
  (fixes the fake placeholder data; all admin-editable).
- `ImageSlot` — id (semantic e.g. `home_hero`), recommended w/h, alt, current asset paths.
- `PageContent` — per-page editable content blocks (14 pages seeded).
- `Program` — catalog (type, prices, duration, capacity, schedule, upsells, images).
- `Upsell` — add-ons per program (cake, photographer, …).
- `Event` — concrete calendar instance of a program (date/time, capacity, assignee).
- `Lead` — site form submissions (type, name, phone, email, program, date, count, comment, source, status).
- `Booking` — pipeline (NEW→CONFIRMED→PAID→COMPLETED→CANCELLED), participants, payment, notes, history.
- `Client` — CRM (auto-populated), visit/purchase history, LTV, tags, notes.
- `Transaction` — finance (amount, method, status, links to booking).
- `Promo` / `Certificate` — codes, discounts, gift certificates.

## 6. Public site

- Shell: Header (nav), Footer, floating contact buttons (fixed links: tel / Telegram / MAX),
  all token-driven.
- 14 pages (`home, tickets, tours, birthday, schools, kindergarten, masterclasses, kvesty,
  teatr, lektsii, partners, contacts, poleznoe, skazki`) as real routes, content from `PageContent`.
- Every image = an `ImageSlot` (lazy, responsive, blur placeholder, labeled fallback if empty).
- Fixes from spec: all "Купить билет/Забронировать" → `/tickets`; Yandex map on contacts
  (lat 59.972991, lon 30.305808); corrected contact links; forms POST to `/api/leads`.
- Payment widget (YooKassa) on `/tickets` — stubbed until keys added.
- Compliance pages (152-ФЗ consent, privacy, offer) — standard filler, company data from settings.

## 7. Admin panel (`/admin`)

Login (bcrypt) + role guards. Sections:
Dashboard · Заявки (leads) · Bookings · Clients (CRM) · Calendar · Programs (+upsells) ·
Finance (admin only) · Analytics · Promo/Certificates · Users (admin only) ·
**Design** (token editor) · **Images** (slot manager) · Settings (company data).
Roles: Administrator (all) · Manager (bookings/clients/events/leads, no finance/users) ·
Cashier (ticket sales + schedule view).

## 8. Integrations (stubs now → live via `.env`)

`lib/integrations/{yookassa,unisender,telegram}.ts` — each reads its keys from `.env`;
if unset, logs "not configured" and no-ops (so nothing breaks pre-secrets).

## 9. Phases (build order)

1. **Foundation** — repo, tokens, Prisma schema, auth+roles, deploy pipeline, CLAUDE.md. *(deployed, login works)*
2. **Public site** — 14 pages rebuilt, image slots, map, fixed buttons, forms→API.
3. **Intake** — leads land in admin Заявки; Telegram notify.
4. **Core CRM** — Bookings pipeline, Clients, Calendar.
5. **Catalog** — Programs + upsells.
6. **Payments + e-tickets** — YooKassa, PDF ticket + QR to email.
7. **Money + insight** — Finance, Analytics, Promo/Certificates.
8. **Comms + polish** — UniSender flows, Metrica, hardening.
9. **Handoff** — CLAUDE.md finalize, CEO maintenance guide, training notes.

## 10. Open items / placeholders to fill later

- Email exact spelling (`museum` vs `muzeum`) — pending CEO; admin-editable default seeded.
- DNS: point skazkamuseum.ru A-record to VPS when ready (build on localhost until then).
- Secrets: YooKassa keys, UniSender API key, Telegram bot token, Metrica counter, Webmaster token.
- Real photographs per image slot (placeholders until uploaded).
