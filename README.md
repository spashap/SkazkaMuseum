# Музей русской сказки «За лесами, за горами»

Website + admin panel for the Museum of Russian Fairy Tales (St. Petersburg).
Next.js (App Router, TypeScript) · SQLite + Prisma · deployed on a Fornex VPS under PM2 + nginx.

## Quick start — no terminal needed (Windows)

1. Double-click **`install.bat`** — checks Node.js, installs everything, creates `.env`
   (with a unique security key), builds the database. Run once.
2. Double-click **`start.bat`** — runs the site and opens the browser at http://localhost:3100.
   Close the window to stop.

Default admin: `admin@skazkamuseum.ru` / `muzei-admin-2026` (change it in the Users section).

## Quick start (terminal alternative)

```bash
npm install
cp .env.example .env      # edit AUTH_SECRET and admin password
npm run setup             # create + seed the database
npm run dev               # http://localhost:3100  (admin at /admin, login at /login)
```

## Docs

- `PLAN.md` — architecture + implementation plan + phases.
- `CLAUDE.md` — how to maintain and extend safely (read before editing).
- `deploy/nginx-skazkamuseum.conf` — server proxy config.

## Deploy

`.\release.bat "message"` (push) then `.\deploy-remote.bat` (build + restart on the server).
