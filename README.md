# Horizon Cap World

Production deployment guide for Horizon Cap World.

## Production Domains

- Website: https://horizoncapworld.com
- Admin: https://admin.horizoncapworld.com
- Investor: https://investor.horizoncapworld.com
- API: https://api.horizoncapworld.com

## Server

Project path:

/var/www/horizonCapWorld

GitHub:

git@github.com:kritidigitalsolutions/horizonCapWorld.git

Server uses Docker + Docker Compose + Nginx.

PM2 is NOT used for the backend.

---

## Docker Containers

| Service | Container | Port |
|---|---|---|
| Backend | horizon-backend | 5000 |
| Website | horizon-website | 3001 |
| Admin | horizon-admin | 3002 |
| Investor | horizon-investor | 3003 |

All containers use:

restart: unless-stopped

Check:

docker compose ps

---

## IMPORTANT: Environment File

Production backend secrets are stored only on VPS:

/var/www/horizonCapWorld/backend/.env

`.env` is NOT stored in GitHub.

Never commit or expose:

- MongoDB password
- JWT_SECRET
- SMTP password
- API keys
- Private keys / wallet keys

---

# Production Update

## Normal Update

When code is pushed to GitHub, SSH into VPS and run:

cd /var/www/horizonCapWorld

git pull origin main

docker compose up -d --build

docker compose ps

That's the main production update process.

---

## Backend Only Update

If only backend code changed:

cd /var/www/horizonCapWorld

git pull origin main

docker compose up -d --build backend

Check logs:

docker logs --tail 100 horizon-backend

---

## If .env Changed

`.env` is NOT pulled from GitHub.

After changing:

nano backend/.env

Run:

docker compose up -d --force-recreate backend

Then:

docker logs --tail 100 horizon-backend

---

## Useful Commands

Check containers:

docker compose ps

Backend logs:

docker logs --tail 100 horizon-backend

All logs:

docker compose logs --tail 100

Restart everything:

docker compose restart

Rebuild everything:

docker compose up -d --build

---

## Check Website/API

curl -I https://horizoncapworld.com

curl -I https://admin.horizoncapworld.com

curl -I https://investor.horizoncapworld.com

curl https://api.horizoncapworld.com

API should return:

{"success":true,"message":"Horizon Capital Backend API Engine Online"}

---

## Nginx

Config:

/etc/nginx/sites-available/horizoncapworld

Before changing Nginx:

sudo nginx -t

Then:

sudo systemctl reload nginx

SSL is managed by Certbot.

---

## GitHub

VPS uses SSH authentication.

Check:

ssh -T git@github.com

Expected:

Hi kritidigitalsolutions! You've successfully authenticated, but GitHub does not provide shell access.

Check Git status:

git status

Check remote:

git remote -v

---

## Development Workflow

Development should normally happen on local PC.

Local PC:

code changes
→ git add
→ git commit
→ git push

VPS:

git pull origin main
→ docker compose up -d --build

---

## Quick Deployment Command

For normal updates:

cd /var/www/horizonCapWorld && git pull origin main && docker compose up -d --build && docker compose ps

---

## Important

DO NOT:

- commit `.env`
- expose passwords/secrets
- use PM2 for backend
- run `git reset --hard` without checking changes
- change production configuration without backup

# End
