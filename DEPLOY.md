# LifeOS Deployment Guide — Azure VM + lifeos.vishrudh.tech

## Prerequisites
- Azure VM running Ubuntu 22.04+ (Standard B2s or higher)
- Domain: `lifeos.vishrudh.tech` (DNS A record → VM public IP)

---

## 1. Initial VM Setup

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx certbot python3-certbot-nginx
```

### Install Node.js 22
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # should be v22+
```

### Install PostgreSQL 16
```bash
sudo apt install -y postgresql-16 postgresql-client-16
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

---

## 2. Database Setup

```bash
sudo -u postgres psql

-- Inside psql:
CREATE USER lifeos WITH PASSWORD 'your_strong_password_here';
CREATE DATABASE lifeos OWNER lifeos;
GRANT ALL PRIVILEGES ON DATABASE lifeos TO lifeos;
\q
```

Test connection:
```bash
psql -U lifeos -d lifeos -h localhost
```

---

## 3. Deploy the App

### Clone / Transfer files
```bash
# Option A: from your local machine
scp -r lifeos/ user@VM_IP:/home/user/lifeos

# Option B: git (if you've pushed to a private repo)
git clone https://github.com/YOU/lifeos.git /home/user/lifeos
```

### Install dependencies
```bash
cd ~/lifeos
npm install
```

### Set up environment variables
```bash
cp .env .env.production
nano .env.production
```

Fill in:
```env
DATABASE_URL="postgresql://lifeos:your_strong_password_here@localhost:5432/lifeos"
JWT_SECRET="generate-with: openssl rand -base64 32"
PIN_HASH="generate-with: node -e \"const b=require('bcryptjs');b.hash('YOUR_4_DIGIT_PIN',12).then(console.log)\""
```

### Generate PIN hash
```bash
node -e "const b=require('bcryptjs'); b.hash('1234',12).then(console.log)"
# Copy the output hash into PIN_HASH in .env.production
```

### Generate JWT secret
```bash
openssl rand -base64 32
```

### Run database migrations
```bash
DATABASE_URL="postgresql://lifeos:YOUR_PASSWORD@localhost:5432/lifeos" npx prisma migrate dev --name init
```

### Build the app
```bash
NODE_ENV=production npm run build
```

---

## 4. PM2 Process Manager

```bash
sudo npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'lifeos',
    script: 'node_modules/.bin/next',
    args: 'start -p 3000',
    cwd: '/home/user/lifeos',
    env_file: '/home/user/lifeos/.env.production',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
  }]
}
EOF

pm2 start ecosystem.config.js
pm2 save
pm2 startup  # follow the instructions printed
```

---

## 5. Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/lifeos
```

```nginx
server {
    listen 80;
    server_name lifeos.vishrudh.tech;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/lifeos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. SSL with Let's Encrypt

```bash
sudo certbot --nginx -d lifeos.vishrudh.tech
# Follow prompts, choose to redirect HTTP to HTTPS
sudo systemctl reload nginx
```

Auto-renewal is set up automatically. Verify with:
```bash
sudo certbot renew --dry-run
```

---

## 7. DNS Setup

In your DNS provider (Cloudflare, Namecheap, etc.):
```
Type: A
Name: lifeos
Value: YOUR_VM_PUBLIC_IP
TTL: Auto (or 300)
```

---

## 8. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 9. Updates

To deploy updates:
```bash
cd ~/lifeos
git pull          # or rsync new files
npm install
npm run build
pm2 restart lifeos
```

---

## Quick Status Check

```bash
pm2 status        # app running?
pm2 logs lifeos   # recent logs
sudo systemctl status nginx
sudo systemctl status postgresql
```

---

## Environment Summary

| Setting     | Value                                      |
|-------------|--------------------------------------------|
| App URL     | https://lifeos.vishrudh.tech               |
| App port    | 3000 (behind Nginx)                        |
| DB          | PostgreSQL 16 on localhost:5432            |
| DB name     | lifeos                                     |
| Process mgr | PM2                                        |
| SSL         | Let's Encrypt via certbot                  |
| CF handle   | vishrudh_raj (hardcoded in lib/codeforces) |
