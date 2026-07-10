# TomeBase Deployment Guide

## Overview

TomeBase runs on:
- **Vercel** — Free hosting for Next.js (auto-deploys on git push)
- **Neon** — Free PostgreSQL database (512MB)
- **GitHub** — Source code + version control

## Prerequisites

- GitHub account
- Vercel account (sign up with GitHub)
- Neon account (sign up with GitHub)

---

## Step 1: Create Neon Database

1. Go to [neon.tech](https://neon.tech)
2. Click **"Sign Up"** → Sign up with GitHub
3. Click **"Create Project"**
   - Project name: `tomebase` (or anything)
   - Database name: `neondb` (default is fine)
   - Region: closest to your users
4. Click **"Create"**
5. Copy the connection string — it looks like:
   ```
   postgresql://neondb_owner:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
6. Save it somewhere — you'll need it for Vercel

---

## Step 2: Prepare the Codebase

The project needs a generate script to auto-detect SQLite (local) vs PostgreSQL (production).

### Files modified:

**`packages/database/scripts/generate.js`** — Auto-detects database type from `DATABASE_URL`

**`packages/database/package.json`** — Added postinstall hook:
```json
"postinstall": "node scripts/generate.js"
```

**`packages/database/.env`** — Your database URL:
```
DATABASE_URL="postgresql://neondb_owner:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

**`apps/web/.env.local`** — App environment:
```
AUTH_SECRET="your-secret-here"
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
DATABASE_URL="postgresql://neondb_owner:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

**`vercel.json`** — Deployment config:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

### Push to GitHub:
```bash
git add -A
git commit -m "feat: add PostgreSQL support, prepare for deployment"
git push
```

---

## Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** → Sign up with GitHub
3. Click **"Add New..."** → **"Project"**
4. Find your `fluid` repository → Click **"Import"**
5. Configure:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `apps/web`
   - **Build Command:** `npm run build`
   - **Install Command:** `npm install`
6. Expand **"Environment Variables"** section
7. Add first variable:
   - **Key:** `DATABASE_URL`
   - **Value:** Your Neon connection string from Step 1
   - Click **"Add"**
8. Add second variable:
   - **Key:** `AUTH_SECRET`
   - **Value:** `jHCKtOF80e+RZv+FTx7diHpGKwH/8jECn7aFc4ixO/c=`
   - Click **"Add"**
9. Add third variable:
   - **Key:** `APP_URL`
   - **Value:** `https://tomebase.vercel.app`
   - Click **"Add"**
10. Click **"Deploy"**
11. Wait ~2 minutes for build to finish
12. Click the preview link to see your live site

---

## Step 4: Initialize Database Tables

After first deploy, push the schema to Neon:

```bash
# Push schema to database
npm run db:push
```

Or run directly:
```bash
DATABASE_URL="postgresql://..." npx prisma db push
```

---

## How It Works

### Local Development (SQLite)
```bash
npm run dev
```
- Uses `file:./dev.db` (SQLite)
- Fast, no network dependency
- Data stored locally

### Production (PostgreSQL)
- Vercel sets `DATABASE_URL` to Neon connection string
- Postinstall script detects PostgreSQL and generates correct Prisma client
- All data stored in Neon cloud database

### Auto-Detection Flow
```
npm install
  → postinstall runs scripts/generate.js
    → reads DATABASE_URL
    → if starts with "postgresql://" → sets provider to postgresql
    → if starts with "file:" → sets provider to sqlite
    → runs prisma generate
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon) |
| `AUTH_SECRET` | Yes | Encryption key for NextAuth sessions |
| `APP_URL` | No | Public URL for sitemap/canonical URLs |
| `AUTH_GITHUB_ID` | No | GitHub OAuth app ID |
| `AUTH_GITHUB_SECRET` | No | GitHub OAuth app secret |
| `AUTH_GOOGLE_ID` | No | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | No | Google OAuth client secret |

---

## Updating the Site

Every time you push to GitHub, Vercel auto-deploys:

```bash
# Make changes
git add -A
git commit -m "your changes"
git push
```

- **main branch** → Production (live site)
- **other branches** → Preview URL

---

## Free Tier Limits

### Vercel (Hobby)
- 100GB bandwidth/month
- 1000 build minutes/month
- Serverless functions

### Neon (Free)
- 512MB storage
- 1 project
- 24/7 compute (scales to zero after inactivity)

---

## Troubleshooting

### Build fails with type error
```bash
npm run typecheck
```
Fix any TypeScript errors, commit, push.

### Database connection fails
- Check `DATABASE_URL` is correct in Vercel
- Make sure Neon project is active (not paused)
- Verify `sslmode=require` is in the URL

### Variables not found in build
- Make sure you clicked **"Add"** after entering each variable
- Make sure variables are set for **Production** environment

---

## Costs

| Service | Monthly Cost |
|---------|--------------|
| Vercel Hobby | $0 |
| Neon Free | $0 |
| **Total** | **$0** |

Upgrade paths:
- Vercel Pro: $20/month (more bandwidth, team features)
- Neon Pro: $19/month (more storage, compute)
