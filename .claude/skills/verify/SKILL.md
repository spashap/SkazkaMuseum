---
name: verify
description: How to build, run, and drive this app to verify changes end-to-end (dev server, test data, admin login, headless Edge)
---

# Verifying changes in Muzei-skazki

## Launch

- Dev server: `npm run dev` (background) → http://localhost:3100, ready in ~2s.
  Port 3100 may already be busy if the user's `start.bat` is running — reuse it, don't start a second.
- NEVER `npm run build` while the dev server runs — it locks Prisma's query-engine DLL (EPERM).
- Local DB is the NESTED path `prisma/prisma/prod.db` (not `prisma/prod.db` — that's the server layout).
- Local `.env` has real Yandex SMTP creds → emails sent from local dev are REAL. Use the
  project owner's address for test buyers, never invented ones.

## Test data

- DB inspect/seed from a scratchpad node script:
  `process.env.DATABASE_URL='file:C:/projects/Muzei-skazki/prisma/prisma/prod.db'` +
  `require('C:/projects/Muzei-skazki/node_modules/@prisma/client')`.
- Event.create requires `endAt` (no default).
- Buy tickets via API (no browser needed):
  `POST /api/tickets/order` `{eventId, fio, phone, email?, items:[{rateId:'adult'|'child'|..., qty}]}`.
- Clean up test rows after (transactions → bookings → event → clients, in that order).

## Admin / staff login

- Staff login page is `/login` (NOT /admin/login) → `POST /api/auth/login` `{email, password}` JSON.
- Seed admin: `admin@skazkamuseum.ru` / `SEED_ADMIN_PASSWORD` from `.env`. If 401, the local
  hash drifted — reset with bcryptjs (`bcrypt.hash(pass,10)` → `user.passwordHash`) and TELL the user.
- Admin pages use server actions (`<form action={...}>`), not REST — drive them through the browser.

## Browser

- No Playwright. `npm i puppeteer-core` in the session scratchpad (NOT the project), launch with
  `executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'`, headless.
- Log in once via `page.evaluate(fetch('/api/auth/login',...))` — cookie lands in the context.
- Server-action buttons: find by `textContent` and `.click()`, then wait ~4s (action + revalidate),
  then `page.reload()` before screenshotting.
- Cashier/entry-control card lives on the customer ticket page `/account/ticket/<bookingId>`
  when viewed with a staff session.

## Flows worth driving

- Guest checkout → `/api/tickets/order` → check `Booking.buyerEmail` + `Client.email`.
- Payment → ticket email: cash path = «Принять оплату на кассе» button on the ticket page.
- Admin list: `/admin/bookings` (+ `?email=problem` filter), `/admin/checkin`.
