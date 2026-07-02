#!/usr/bin/env bash
# Runs ON THE SERVER (called by deploy-remote.bat over SSH).
# Pulls latest code, installs deps, runs migrations, builds, restarts PM2.
# Mirrors the existing `shepotzvezd` deploy pattern on this VPS.
set -euo pipefail

export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null || nvm use --lts

cd /var/www/skazkamuseum

echo "== git pull =="
git pull --ff-only

echo "== npm install =="
npm install --no-audit --no-fund

echo "== prisma db push + build =="
npx prisma db push --skip-generate
npm run build

echo "== restart pm2 =="
pm2 restart skazkamuseum || pm2 start npm --name skazkamuseum -- start
pm2 save

echo "== DONE =="
