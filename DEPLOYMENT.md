# Horizon Cap World — Production VPS Deployment Guide

This guide provides end-to-end instructions for deploying Horizon Cap World to an Ubuntu Linux VPS (Ubuntu 22.04 LTS or 24.04 LTS).

---

## Architecture Overview

```
                      INTERNET / CLIENTS
                              │
               ┌──────────────┼──────────────┐
               ▼              ▼              ▼
     horizoncapworld.com      admin.         investor.     api.
     www.horizoncapworld.com  horizoncap-    horizoncap-   horizoncap-
     (Main Website)          world.com      world.com     world.com
                              (Admin Dash)   (User Dash)   (Backend API)
               │              │              │              │
               └──────────────┼──────────────┘              │
                              ▼                             ▼
                 NGINX REVERSE PROXY & STATIC HOSTING (PORT 80/443 SSL)
                              │                             │
          ┌───────────────────┼───────────────────┐         │ Proxy pass
          ▼                   ▼                   ▼         ▼
     website/dist      admin-dashboard/    user-dashboard/  PM2 Node.js Backend
     Static Files      dist Static Files   dist Static Files (127.0.0.1:5000)
                                                            │
                                                            ▼
                                                    MongoDB Atlas + BSC
```

---

## 1. Domain & DNS Configuration

Before beginning server setup, point your domain DNS `A` records to your VPS Public IP address in your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):

| Type | Host / Name | Value / Points To | Target Application | TTL |
|---|---|---|---|---|
| `A` | `@` | `<VPS_PUBLIC_IP>` | Main Website (`horizoncapworld.com`) | Auto / 300 |
| `A` | `www` | `<VPS_PUBLIC_IP>` | Main Website (`www.horizoncapworld.com`) | Auto / 300 |
| `A` | `admin` | `<VPS_PUBLIC_IP>` | Admin Dashboard (`admin.horizoncapworld.com`) | Auto / 300 |
| `A` | `investor` | `<VPS_PUBLIC_IP>` | User Dashboard (`investor.horizoncapworld.com`) | Auto / 300 |
| `A` | `app` | `<VPS_PUBLIC_IP>` | User Dashboard Alias (`app.horizoncapworld.com`) | Auto / 300 |
| `A` | `api` | `<VPS_PUBLIC_IP>` | Backend REST API (`api.horizoncapworld.com`) | Auto / 300 |

*Note: If using Cloudflare, start with SSL/TLS encryption mode set to **Full (strict)** and proxy mode (orange cloud) enabled or disabled during initial Certbot verification.*

---

## 2. Server Preparation & Tool Installation

SSH into your VPS as `root`:
```bash
ssh root@<VPS_PUBLIC_IP>
```

### 2.1 Update Operating System Packages
```bash
apt update && apt upgrade -y
apt install -y curl wget git build-essential ufw nginx certbot python3-certbot-nginx
```

### 2.2 Install Node.js 20 LTS (Active LTS) & npm
```bash
# Clean up any conflicting legacy Node versions
apt remove -y nodejs npm 2>/dev/null || true

# Add NodeSource official Node.js 20 LTS repository
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Install Node.js 20 & npm
apt install -y nodejs

# Verify versions
node -v   # Expected: v20.x.x
npm -v    # Expected: 10.x.x
```

### 2.3 Install PM2 Globally
```bash
npm install -g pm2
pm2 --version
```

### 2.4 Configure UFW Firewall
```bash
ufw allow 22/tcp      # SSH access
ufw allow 80/tcp      # HTTP (Certbot & Web)
ufw allow 443/tcp     # HTTPS (Secure SSL)
ufw --force enable
ufw status
```

---

## 3. Repository Deployment & Permissions

### 3.1 Clone Project to Production Directory
```bash
mkdir -p /var/www
cd /var/www

# Clone repository
git clone https://github.com/kritidigitalsolutions/horizonCapWorld.git horizoncapworld
cd /var/www/horizoncapworld
```

### 3.2 Set Proper Directory Permissions
```bash
chown -R www-data:www-data /var/www/horizoncapworld
chmod -R 755 /var/www/horizoncapworld
```

---

## 4. Backend Setup & Configuration

### 4.1 Install Backend Dependencies
```bash
cd /var/www/horizoncapworld/backend

# Clean reproducible install
npm ci --omit=dev
```

### 4.2 Configure Backend Environment Variables
Create the production `.env` file:
```bash
nano /var/www/horizoncapworld/backend/.env
```

Paste the following configuration, replacing the placeholder values with your production secrets:
```env
# Server Runtime
PORT=5000
NODE_ENV=production

# MongoDB Database Connection
MONGO_URI=mongodb+srv://<db_username>:<db_password>@<cluster_host>/horizoncap?retryWrites=true&w=majority

# Cryptographically Secure JWT Secret (64+ chars)
JWT_SECRET=generate_strong_secret_key_here_e_g_using_openssl_rand_hex_32

# Cloudinary CDN Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email / SMTP Configuration (Gmail SMTP)
EMAIL_USER=tradex615@gmail.com
EMAIL_PASS=your_gmail_16_character_app_password
CONTACT_RECEIVER_EMAIL=support@horizoncapworld.com

# Backend Public Domain
BACKEND_URL=https://api.horizoncapworld.com

# Production CORS Whitelist
CORS_ORIGIN=https://horizoncapworld.com,https://www.horizoncapworld.com,https://admin.horizoncapworld.com,https://investor.horizoncapworld.com,https://app.horizoncapworld.com,https://api.horizoncapworld.com
ALLOWED_ORIGINS=https://horizoncapworld.com,https://www.horizoncapworld.com,https://admin.horizoncapworld.com,https://investor.horizoncapworld.com,https://app.horizoncapworld.com,https://api.horizoncapworld.com

# Blockchain Explorer API Key (BscScan / Etherscan)
ETHERSCAN_API_KEY=your_bscscan_or_etherscan_api_key

# Smart Contract Payout Pool (Binance Smart Chain Mainnet)
PAYOUT_POOL_ADDRESS=0x439DBd3A00E41255e0Bd26d8976E67310aDB7fd3
BSC_RPC_URL=https://bsc-dataseed.binance.org/
BSC_NETWORK=BSC_MAINNET
RELAYER_ADDRESS=0x1B892C03E3031288137951693F4E40553Dd2E5f6
RELAYER_PRIVATE_KEY=your_bsc_relayer_wallet_private_key_without_0x_prefix
```
*Save and exit (`Ctrl + O`, `Enter`, `Ctrl + X`).*

Secure the permissions of the `.env` file:
```bash
chmod 600 /var/www/horizoncapworld/backend/.env
```

### 4.3 Configure PM2 Ecosystem
Create `/var/www/horizoncapworld/ecosystem.config.js`:
```bash
nano /var/www/horizoncapworld/ecosystem.config.js
```

Paste:
```javascript
module.exports = {
  apps: [
    {
      name: "horizon-backend",
      cwd: "/var/www/horizoncapworld/backend",
      script: "server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      error_file: "/var/log/pm2/horizon-backend-error.log",
      out_file: "/var/log/pm2/horizon-backend-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
```

Create log directory and start PM2:
```bash
mkdir -p /var/log/pm2

pm2 start /var/www/horizoncapworld/ecosystem.config.js
pm2 save
pm2 startup
# (Run the generated sudo env command printed by pm2 startup)
```

Verify backend is healthy:
```bash
curl http://127.0.0.1:5000/health
# Expected Output: {"status":"ok"}
```

---

## 5. Frontend Production Builds

### 5.1 Admin Dashboard Build
```bash
cd /var/www/horizoncapworld/admin-dashboard

# Create .env
cat <<EOF > .env
VITE_API_URL=https://api.horizoncapworld.com/api
EOF

npm ci
npm run build
```
*Verified output directory:* `/var/www/horizoncapworld/admin-dashboard/dist`

### 5.2 User Dashboard Build
```bash
cd /var/www/horizoncapworld/user-dashboard

# Create .env
cat <<EOF > .env
VITE_API_URL=https://api.horizoncapworld.com/api
EOF

npm ci
npm run build
```
*Verified output directory:* `/var/www/horizoncapworld/user-dashboard/dist`

### 5.3 Landing Website Build
```bash
cd /var/www/horizoncapworld/website

# Create .env
cat <<EOF > .env
VITE_API_URL=https://api.horizoncapworld.com/api
EOF

npm ci
npm run build
```
*Verified output directory:* `/var/www/horizoncapworld/website/dist`

---

## 6. Nginx Web Server Configuration

Remove default Nginx configuration:
```bash
rm -f /etc/nginx/sites-enabled/default
```

Create the unified Horizon Cap World Nginx configuration file:
```bash
nano /etc/nginx/sites-available/horizoncapworld.conf
```

Paste the following production configuration:

```nginx
# ─────────────────────────────────────────────────────────────────
# 1. LANDING WEBSITE: www.horizoncapworld.com & horizoncapworld.com
# ─────────────────────────────────────────────────────────────────
server {
    listen 80;
    server_name www.horizoncapworld.com horizoncapworld.com;

    root /var/www/horizoncapworld/website/dist;
    index index.html;

    access_log /var/log/nginx/website_access.log;
    error_log /var/log/nginx/website_error.log;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}

# ─────────────────────────────────────────────────────────────────
# 2. ADMIN DASHBOARD: admin.horizoncapworld.com
# ─────────────────────────────────────────────────────────────────
server {
    listen 80;
    server_name admin.horizoncapworld.com;

    root /var/www/horizoncapworld/admin-dashboard/dist;
    index index.html;

    access_log /var/log/nginx/admin_access.log;
    error_log /var/log/nginx/admin_error.log;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}

# ─────────────────────────────────────────────────────────────────
# 3. USER / INVESTOR DASHBOARD: investor.horizoncapworld.com
# ─────────────────────────────────────────────────────────────────
server {
    listen 80;
    server_name investor.horizoncapworld.com app.horizoncapworld.com;

    root /var/www/horizoncapworld/user-dashboard/dist;
    index index.html;

    access_log /var/log/nginx/app_access.log;
    error_log /var/log/nginx/app_error.log;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}

# ─────────────────────────────────────────────────────────────────
# 4. BACKEND API REVERSE PROXY: api.horizoncapworld.com
# ─────────────────────────────────────────────────────────────────
server {
    listen 80;
    server_name api.horizoncapworld.com;

    access_log /var/log/nginx/api_access.log;
    error_log /var/log/nginx/api_error.log;

    # Maximum file upload size (matches backend limits for slips and receipts)
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }
}
```

Enable the configuration and restart Nginx:
```bash
ln -sf /etc/nginx/sites-available/horizoncapworld.conf /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 7. SSL Certificate Installation (Let's Encrypt / Certbot)

Run Certbot to automatically configure free TLS/SSL certificates for all subdomains:
```bash
certbot --nginx -d horizoncapworld.com -d www.horizoncapworld.com -d admin.horizoncapworld.com -d investor.horizoncapworld.com -d app.horizoncapworld.com -d api.horizoncapworld.com --non-interactive --agree-tos -m admin@horizoncapworld.com --redirect
```

Verify automated renewal cron:
```bash
certbot renew --dry-run
```

---

## 8. Verification & Live Health Checks

Perform live verification from terminal or external browser:

```bash
# 1. API Health Check
curl -I https://api.horizoncapworld.com/health
# Expected: HTTP/2 200 OK

curl https://api.horizoncapworld.com/health
# Expected: {"status":"ok"}

# 2. Main Website
curl -I https://horizoncapworld.com
# Expected: HTTP/2 200 OK

# 3. Admin Dashboard
curl -I https://admin.horizoncapworld.com
# Expected: HTTP/2 200 OK

# 4. Investor / User Portal
curl -I https://investor.horizoncapworld.com
# Expected: HTTP/2 200 OK
```

---

## 9. Maintenance, Logs & Zero-Downtime Redeployment

### 9.1 View Live PM2 Logs
```bash
pm2 logs horizon-backend
```

### 9.2 View Nginx Access & Error Logs
```bash
tail -f /var/log/nginx/api_error.log
tail -f /var/log/nginx/website_error.log
```

### 9.3 Zero-Downtime Redeployment Script
Create `/var/www/horizoncapworld/deploy.sh`:
```bash
nano /var/www/horizoncapworld/deploy.sh
```

Paste:
```bash
#!/bin/bash
set -e

echo "=== Pulling latest changes ==="
cd /var/www/horizoncapworld
git pull origin main

echo "=== Updating Backend ==="
cd /var/www/horizoncapworld/backend
npm ci --omit=dev
pm2 reload horizon-backend

echo "=== Rebuilding Website ==="
cd /var/www/horizoncapworld/website
npm ci
npm run build

echo "=== Rebuilding Admin Dashboard ==="
cd /var/www/horizoncapworld/admin-dashboard
npm ci
npm run build

echo "=== Rebuilding User Dashboard ==="
cd /var/www/horizoncapworld/user-dashboard
npm ci
npm run build

echo "=== Reloading Nginx ==="
sudo systemctl reload nginx

echo "=== Deployment Completed Successfully! ==="
```

Make it executable:
```bash
chmod +x /var/www/horizoncapworld/deploy.sh
```

### 9.4 Rollback Procedure
If a bad build or code regression occurs:
```bash
cd /var/www/horizoncapworld
git log -n 5 --oneline
# Revert to previous good commit hash:
git checkout <PREVIOUS_COMMIT_HASH>
/var/www/horizoncapworld/deploy.sh
```
