# CLAUDE.md — Museum of Russian Fairy Tales

Guidance for Claude Code (and humans) working in this repo. Read this first.
The site is in Russian; keep all user-facing text (site, admin, SEO, emails) in Russian.

## What this is

A Next.js (App Router, TypeScript) app that is BOTH the public museum website and the
staff admin panel (CRM / bookings / content), backed by SQLite via Prisma. One repo,
one language, one deploy. Runs on a Fornex VPS under PM2 behind nginx, alongside other sites.

- Public site: `src/app/(site)/**` — 14 pages (full fidelity port of the CEO's design).
- Admin panel: `src/app/admin/**` — login-protected, role-based.
- API: `src/app/api/**`.
- Shared logic: `src/lib/**`. Reusable UI: `src/components/**`.
- Data model: `prisma/schema.prisma`.

## Golden rules (do not break these)

1. **Single CSS control.** ALL fonts, sizes, and colors come from CSS variables defined in
   `src/lib/theme.ts` (rendered from the `Theme` DB row in `src/app/layout.tsx`). Components
   must style themselves with `var(--...)` ONLY. Never hardcode a hex color, font family, or
   px font-size in a component. To add a design value, add a token — don't inline it.
2. **Constrained scale.** Fonts: 3 families (`--font-display`, `--font-serif`, `--font-body`).
   Sizes: 7 steps (`--fs-hero-xl … --fs-caption`). Weights: 3 (400/600/700). Don't introduce more.
3. **Images = slots.** Never embed a raw base64 image or a fixed content image in a page.
   Every site image is a named `ImageSlot` (DB row + a `/seed/<id>.webp` default); admin uploads
   replace it. See the fidelity-port section for how images live inside the page fragments.
4. **Content is data.** Public page copy currently lives in `src/content/fragments/*.html`
   (the fidelity port — see last section); company facts live in `CompanySettings` and SEO
   meta in `PageContent`, both admin-editable. Don't hardcode company facts in JSX.
5. **Secrets live in `.env` on the server only.** Never commit `.env`. Integrations no-op when
   their keys are missing, so the app always runs. Don't add secrets to code.
6. **Roles gate access.** Use `getSession()` + `canAccess(role, section)` from `src/lib/auth.ts`
   in every admin page and protected API route. Permissions are defined once in `SECTION_ACCESS`.

## Everyday commands

```bash
npm install          # install deps
npm run setup        # first time: generate client + create DB + seed (admin user, pages, slots)
npm run dev          # local dev at http://localhost:3100
npm run build        # production build
npm run db:studio    # visual DB browser (Prisma Studio)
npm run db:seed      # re-seed defaults (idempotent)
```

Default admin after seeding: `admin@skazkamuseum.ru` / value of `SEED_ADMIN_PASSWORD`
(see `.env`; falls back to `muzei-admin-2026`). Change it in the Users section after first login.

## Changing the database

Edit `prisma/schema.prisma`, then run `npm run db:push` (applies the schema to SQLite).
On deploy, `deploy.sh` runs `prisma db push` automatically, so schema changes go live on deploy.
This project uses `db push` (not migrations) for simplicity — great for additive changes.
⚠️ Destructive edits (removing/retyping a column with data) can drop data — copy the DB file first.
SQLite = one file (`prisma/prod.db` on the server). Back it up by copying that file (cron it daily).

To upgrade to PostgreSQL later: change `datasource.provider` + `DATABASE_URL`, adjust any
SQLite-only bits, migrate. The app code doesn't need to change.

## Daily workflow (both PCs — Pavel and the CEO)

- `pull.bat` — FIRST file to run on a new PC: installs Git/Node/Claude Code if missing,
  then pulls the latest code from GitHub (guards against wiping unpushed local changes).
  A new machine needs only `pull.bat` + `.env`; everything else comes with the pull.
- `install.bat` — one-time after the first pull: deps, `.env` fallback, DB create+seed.
- `start.bat` — run the dev server at http://localhost:3100.
- `push.bat` — bump the site version (see below), commit with a description, push to GitHub.

**Versioning:** the `VERSION` file holds e.g. `V01.001` (major.minor). Every `push.bat` run
raises the minor part by 1 and the commit message starts with the version. The version is
shown in the footer of every public page and in the admin sidebar (`src/lib/version.ts`).
Raise the MAJOR part manually by editing `VERSION` (set minor back to `000` so the next
push makes `.001`). When committing manually instead of via push.bat, bump `VERSION` yourself.

## Deploying (server — to be set up later)

`.\deploy-remote.bat` — SSHes to the VPS and runs `deploy.sh` (pull, install, db push, build, PM2 restart).

Server layout (Ubuntu 24.04, Fornex): app at `/var/www/skazkamuseum`, PM2 process `skazkamuseum`
on `127.0.0.1:3100`, nginx proxies `skazkamuseum.ru` to it (see `deploy/nginx-skazkamuseum.conf`),
SSL via certbot. Node 22 via nvm (deploy.sh sources it — a bare `node` over SSH will fail).

First-time server setup (once):
```bash
cd /var/www && git clone https://github.com/spashap/SkazkaMuseum skazkamuseum && cd skazkamuseum
cp .env.example .env && nano .env           # fill AUTH_SECRET, admin pass, etc.
npm install && npm run setup                # create + seed DB
npm run build && pm2 start npm --name skazkamuseum -- start
pm2 save && pm2 startup                      # survive reboots
# add nginx config + run certbot (see deploy/nginx-skazkamuseum.conf)
```

## Where things live (quick map)

| Task | File(s) |
|---|---|
| Change a design token programmatically | `prisma/schema.prisma` (Theme) + admin "Дизайн" page |
| Add/rename an image slot | `prisma/seed.mjs` + `src/content/slots.json`; component `src/components/site/ImageSlot.tsx` |
| Edit page copy | `src/content/fragments/<page>.html` (renderer `src/lib/fragments.ts` → `src/app/(site)/[page]/page.tsx`) |
| Site forms → leads | `public/site-overrides.js` (intercepts) → `src/app/api/leads/route.ts` |
| Payments | `src/lib/integrations/yookassa.ts` + `src/app/api/pay/route.ts` |
| Email | `src/lib/integrations/unisender.ts` |
| Telegram alerts | `src/lib/integrations/telegram.ts` |
| Auth & roles | `src/lib/auth.ts` |
| Admin sidebar/sections | `src/app/admin/layout.tsx` |

## Roadmap / status

See `PLAN.md`. Current build covers Phase 1–3 foundation + the full-fidelity public site
(deploy pipeline, tokens, DB, auth, 14 pages with her real content, WebP+lazy images,
intake→leads, admin shell with working Design/Images/Settings/Заявки/Users).
Phases 4–8 (full bookings pipeline UI, calendar drag&drop, catalog editor, YooKassa live flow +
PDF/QR tickets, finance/analytics depth, UniSender flows) are scaffolded with clear placeholders —
each admin page notes which phase completes it.

## Style for contributors

Prefer server components; add `'use client'` only when you need interactivity. Keep components
small and reuse the primitives in `globals.css` (`.btn`, `.card`, `.grid`, `.field`, `.container`).
When unsure, follow an existing page of the same kind rather than inventing a new pattern.

## How the public site is built (fidelity port)

The 14 public pages are the CEO's original design, preserved verbatim. Her markup was
extracted from `projectSpec/muzeyskazki_v3_final_244.html` by `scripts/extract-original.mjs` into:

- `src/content/fragments/*.html` — full HTML of each page (+ `header.html`, `footer.html`).
- `src/app/(site)/site.css` — her original CSS (its `:root` and inline `<style>` removed;
  tokens injected instead). Imported only in `(site)/layout.tsx`, so it never touches the admin.
- `public/site-runtime.js` — her original JS (calendar, FAQ, etc.).
- `public/site-overrides.js` — our thin overrides: `showPage()` → real routing, and site
  forms → `POST /api/leads`.
- `public/seed/<slot>.webp` — every image decoded from the original and optimized to WebP
  (admin-replaceable). All `<img>` are `loading="lazy"` for a light, fast page.

At render time, `src/lib/fragments.ts` takes a fragment and (1) swaps a slot's seed image for
an admin-uploaded one when present, (2) fixes contact links from `CompanySettings`, (3) marks
the page section active. Pages render the fragment via `dangerouslySetInnerHTML`.

**To edit page text:** edit the fragment HTML in `src/content/fragments/`. **To change an
image:** admin → «Изображения» (never edit base64 or add a raw `<img>`). **To re-extract from a
new prototype:** re-run `node scripts/extract-original.mjs` (regenerates fragments + WebP seed
images + `slots.json`; requires sharp).
