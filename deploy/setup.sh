#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Storein — VPS Initial Setup (Ubuntu 22.04+)
# Run once as root: bash setup.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "══════════════════════════════════════════"
echo " Storein VPS Setup"
echo "══════════════════════════════════════════"

# ── System update ─────────────────────────────────────────────────────────────
apt-get update && apt-get upgrade -y
apt-get install -y curl git build-essential nginx ufw

# ── Node.js 20 via nvm ────────────────────────────────────────────────────────
echo ">>> Installing Node.js 20..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
nvm alias default 20
echo "Node: $(node -v) | npm: $(npm -v)"

# ── PM2 ───────────────────────────────────────────────────────────────────────
echo ">>> Installing PM2..."
npm install -g pm2

# ── MongoDB 7 ─────────────────────────────────────────────────────────────────
echo ">>> Installing MongoDB 7..."
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc \
  | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" \
  | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt-get update
apt-get install -y mongodb-org
systemctl start mongod
systemctl enable mongod
echo "MongoDB status: $(systemctl is-active mongod)"

# ── Redis ─────────────────────────────────────────────────────────────────────
echo ">>> Installing Redis..."
apt-get install -y redis-server
systemctl start redis-server
systemctl enable redis-server
echo "Redis status: $(systemctl is-active redis-server)"

# ── Nginx ─────────────────────────────────────────────────────────────────────
echo ">>> Configuring Nginx..."
systemctl enable nginx

# ── Firewall ──────────────────────────────────────────────────────────────────
echo ">>> Configuring UFW firewall..."
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 4000/tcp     # Admin panel
ufw --force enable

# ── Log directory ─────────────────────────────────────────────────────────────
mkdir -p /var/log/pm2

# ── App directory ─────────────────────────────────────────────────────────────
mkdir -p /var/www/storein

echo ""
echo "══════════════════════════════════════════"
echo " Setup complete! Next steps:"
echo "══════════════════════════════════════════"
echo ""
echo "1. Clone the repo:"
echo "   git clone https://github.com/sabervalimohamadi/storein-glasses.git /var/www/storein"
echo ""
echo "2. Create env files:"
echo "   cp /var/www/storein/deploy/backend.env.example /var/www/storein/storein/.env"
echo "   cp /var/www/storein/deploy/nuxt.env.example    /var/www/storein/storein-nuxt/.env"
echo "   nano /var/www/storein/storein/.env       # fill in YOUR_VPS_IP + secrets"
echo "   nano /var/www/storein/storein-nuxt/.env  # fill in YOUR_VPS_IP"
echo ""
echo "3. Setup Nginx:"
echo "   cp /var/www/storein/deploy/nginx.conf /etc/nginx/sites-available/storein"
echo "   ln -s /etc/nginx/sites-available/storein /etc/nginx/sites-enabled/"
echo "   rm -f /etc/nginx/sites-enabled/default"
echo "   nano /etc/nginx/sites-available/storein  # replace YOUR_VPS_IP"
echo "   nginx -t && systemctl reload nginx"
echo ""
echo "4. Build and start:"
echo "   bash /var/www/storein/deploy/deploy.sh --first-run"
echo ""
