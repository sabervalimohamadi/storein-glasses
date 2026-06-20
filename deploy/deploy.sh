#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Storein — Deploy / Update Script
# Usage:
#   bash deploy.sh              → pull latest + rebuild + reload PM2
#   bash deploy.sh --first-run  → also registers PM2 startup on first deploy
# ─────────────────────────────────────────────────────────────────────────────
set -e

APP_DIR="/var/www/storein"
FIRST_RUN=false
[[ "$1" == "--first-run" ]] && FIRST_RUN=true

export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"

echo "══════════════════════════════════════════"
echo " Storein Deploy  $(date '+%Y-%m-%d %H:%M')"
echo "══════════════════════════════════════════"

# ── Pull latest code ──────────────────────────────────────────────────────────
cd "$APP_DIR"
echo ">>> Pulling latest code..."
git pull origin master

# ── Backend (NestJS) ─────────────────────────────────────────────────────────
echo ">>> Building backend..."
cd "$APP_DIR/storein"
npm ci --prefer-offline
npm run build

# ── Nuxt SSR Frontend ─────────────────────────────────────────────────────────
echo ">>> Building Nuxt..."
cd "$APP_DIR/storein-nuxt"
npm ci --prefer-offline
npm run build

# ── Admin Panel ───────────────────────────────────────────────────────────────
echo ">>> Building admin..."
cd "$APP_DIR/storein-admin"
npm ci --prefer-offline
npm run build

# ── PM2 ───────────────────────────────────────────────────────────────────────
cd "$APP_DIR"
if $FIRST_RUN; then
  echo ">>> Starting PM2 (first run)..."
  pm2 start deploy/ecosystem.config.js
  pm2 save
  pm2 startup | tail -1 | bash   # register PM2 to start on boot
else
  echo ">>> Reloading PM2..."
  pm2 reload deploy/ecosystem.config.js --update-env
fi

echo ""
echo "══════════════════════════════════════════"
echo " Deploy complete!"
echo " Frontend : http://$(curl -s ifconfig.me)"
echo " Admin    : http://$(curl -s ifconfig.me):4000"
echo " API      : http://$(curl -s ifconfig.me)/api/v1"
echo "══════════════════════════════════════════"
pm2 list
