# Production Deployment Guide

## Quick Option: Railway (10 minutes)

Easiest way to go live. PostgreSQL, SSL, and custom domains built in.

```
1. Push repo to GitHub
2. Create account at https://railway.com
3. Click "New Project" → "Deploy from GitHub repo"
4. Set build command:  npm run build
5. Set start command:  npm run start --prefix apps/web
6. Add PostgreSQL plugin (Railway provisions it automatically)
7. Set environment variables (see below)
8. Deploy — Railway detects the monorepo and handles the rest
```

## Manual Option: Any VPS or PaaS

### 1. Database

Fluid uses PostgreSQL in production. SQLite is for development only.

```bash
# Provision PostgreSQL (e.g., Railway, Render, Neon, Supabase, AWS RDS)
# Get the connection string:
# postgresql://user:password@host:5432/fluid?schema=public
```

### 2. Environment Variables

Set these in your production environment:

| Variable             | Required | Description                                     |
|----------------------|----------|-------------------------------------------------|
| `DATABASE_URL`       | Yes      | PostgreSQL connection string                     |
| `AUTH_SECRET`        | Yes      | `openssl rand -base64 32`                       |
| `APP_URL`            | Yes      | Canonical public URL, e.g. `https://usedocs.com` |
| `AUTH_GITHUB_ID`     | No       | GitHub OAuth App client ID                      |
| `AUTH_GITHUB_SECRET` | No       | GitHub OAuth App client secret                  |
| `AUTH_GOOGLE_ID`     | No       | Google OAuth client ID                          |
| `AUTH_GOOGLE_SECRET` | No       | Google OAuth client secret                      |

### 3. Build & Start

```bash
npm install
npm run db:generate
npm run db:push       # Creates tables in PostgreSQL
npm run build
npm run start --prefix apps/web
```

### 4. Custom Domain

Point your domain's DNS:

```
Type: CNAME
Name: docs (or @ for apex)
Target: your-app.up.railway.app (or your hosting provider's target)
```

Then set the domain in your hosting provider's dashboard. Fluid's built-in
custom domain support handles the rest (the middleware detects the Host header
and rewrites to the correct project).

## Recommended Providers

| Provider | Pros                                      | Pricing           |
|----------|-------------------------------------------|-------------------|
| Railway  | One-click deploy, PG plugin, domains       | Free tier, $5/mo  |
| Render   | Blueprint deploy, PG, CDN                 | Free tier, $7/mo  |
| Vercel   | Great Next.js support, edge functions     | Pro $20/mo + PG   |
| Fly.io   | Global regions, Docker-based              | $1.94/mo + usage  |

## Data

All user data lives in PostgreSQL. Backups:
- Railway/Render: automatic daily backups
- Manual: `pg_dump postgresql://... > backup.sql`

## Monitoring

- Railway/Render/Vercel: built-in logs and metrics
- Add Sentry for error tracking:
  ```bash
  npm install @sentry/nextjs
  npx sentry/wizard -i nextjs
  ```
