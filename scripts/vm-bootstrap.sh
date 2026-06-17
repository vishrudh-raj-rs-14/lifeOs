#!/usr/bin/env bash
# ============================================================
# LifeOS — VM Bootstrap Script
# Run this ONCE inside the Azure VM after first SSH login.
# Usage: bash vm-bootstrap.sh YOUR_GITHUB_REPO_URL YOUR_DB_PASSWORD YOUR_PIN
# Example: bash vm-bootstrap.sh https://github.com/you/lifeos.git "s3cur3pass" "1234"
# ============================================================
set -euo pipefail

REPO_URL="${1:-}"
DB_PASSWORD="${2:-}"
PIN="${3:-}"

if [[ -z "$REPO_URL" || -z "$DB_PASSWORD" || -z "$PIN" ]]; then
  echo "Usage: bash vm-bootstrap.sh <REPO_URL> <DB_PASSWORD> <PIN>"
  exit 1
fi

echo "=== LifeOS VM Bootstrap ==="

# ── 1. System packages ──────────────────────────────────────
echo "→ Updating system..."
sudo apt-get update -qq && sudo apt-get upgrade -y -qq

echo "→ Installing nginx, certbot, git, build tools..."
sudo apt-get install -y -qq git curl nginx certbot python3-certbot-nginx ufw

# ── 2. Node.js 22 ───────────────────────────────────────────
echo "→ Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - >/dev/null
sudo apt-get install -y -qq nodejs
echo "   Node: $(node --version)  NPM: $(npm --version)"

# ── 3. PM2 ──────────────────────────────────────────────────
echo "→ Installing PM2..."
sudo npm install -g pm2 --quiet

# ── 4. PostgreSQL 16 ────────────────────────────────────────
echo "→ Installing PostgreSQL 16..."
sudo apt-get install -y -qq postgresql postgresql-client
sudo systemctl enable postgresql
sudo systemctl start postgresql

echo "→ Creating database and user..."
sudo -u postgres psql <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'lifeos') THEN
    CREATE USER lifeos WITH PASSWORD '$DB_PASSWORD';
  END IF;
END
\$\$;
CREATE DATABASE lifeos OWNER lifeos;
GRANT ALL PRIVILEGES ON DATABASE lifeos TO lifeos;
SQL

# ── 5. Clone repo ───────────────────────────────────────────
echo "→ Cloning repo..."
git clone "$REPO_URL" ~/lifeos
cd ~/lifeos

# ── 6. Environment file ─────────────────────────────────────
echo "→ Generating secrets..."
JWT_SECRET=$(openssl rand -base64 32)
PIN_HASH=$(node -e "const b=require('bcryptjs'); b.hash('$PIN',12).then(h=>process.stdout.write(h))")

cat > ~/lifeos/.env << EOF
DATABASE_URL="postgresql://lifeos:${DB_PASSWORD}@localhost:5432/lifeos"
JWT_SECRET="${JWT_SECRET}"
PIN_HASH="${PIN_HASH}"
EOF
echo "   .env written"

# ── 7. Install deps + build ─────────────────────────────────
echo "→ Installing npm dependencies..."
npm ci

echo "→ Generating Prisma client..."
npx prisma generate

echo "→ Running DB migrations..."
npx prisma migrate deploy

echo "→ Building Next.js app..."
NODE_ENV=production npm run build

# ── 8. PM2 ──────────────────────────────────────────────────
echo "→ Starting app with PM2..."
cat > ~/lifeos/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'lifeos',
    script: 'node_modules/.bin/next',
    args: 'start -p 3000',
    cwd: '/home/' + process.env.USER + '/lifeos',
    env_file: '/home/' + process.env.USER + '/lifeos/.env',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
  }]
}
EOF

pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u "$USER" --hp "$HOME" | tail -1 | sudo bash

# ── 9. Nginx ────────────────────────────────────────────────
echo "→ Configuring Nginx..."
sudo tee /etc/nginx/sites-available/lifeos > /dev/null << 'NGINX'
server {
    listen 80;
    server_name lifeos.vishrudh.tech;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/lifeos /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# ── 10. Firewall ────────────────────────────────────────────
echo "→ Configuring UFW firewall..."
sudo ufw --force enable
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

echo ""
echo "=============================================="
echo "✓ Bootstrap complete!"
echo ""
echo "App running at: http://lifeos.vishrudh.tech"
echo "(HTTPS: run certbot after DNS propagates)"
echo ""
echo "To enable HTTPS:"
echo "  sudo certbot --nginx -d lifeos.vishrudh.tech"
echo "=============================================="
echo ""
pm2 status
