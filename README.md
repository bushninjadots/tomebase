# Fluid

Knowledge that flows into action. An AI-powered documentation platform for modern engineering teams.

## Quick Start

```bash
npm install
npm run db:push
npm run dev
```

Visit `http://localhost:3000` — sign up with email/password to get started.

## Features

- **Markdown editor** with live preview, auto-save, and formatting toolbar
- **Hierarchical pages** with nested sidebar, drag-style reorder, and breadcrumbs
- **Wiki links** — `[[Page Name]]` auto-resolves to internal links in preview and published docs
- **Backlinks & Tags** — see which pages reference the current page; filter by extracted `#tags`
- **Search** — Cmd+K palette searches titles and content across the project
- **Graph view** — visualize page connections as a force-directed graph
- **Page templates** — Getting Started, API Reference, Troubleshooting, Release Notes
- **Code import** — paste TypeScript/JavaScript to auto-generate documentation pages
- **Public docs** — publish projects to a public URL at `/p/[project]`
- **Team collaboration** — invite members via shareable links (7-day expiry)
- **API keys** — generate `fl_` prefixed keys for programmatic access
- **Tier limits** — Free: 1 project, 50 pages, 3 members

## Architecture

```
fluid/
├── apps/web/          # Next.js 15 App Router
├── packages/
│   ├── ui/            # Shared components (Button, Input, Card, etc.)
│   ├── utils/         # Helpers (cn, slugify, truncate, etc.)
│   ├── database/      # Prisma schema + client
│   ├── codegen/       # TypeScript/JS parser → Markdown docs
│   ├── ai/            # AI SDK placeholder (Coming Soon)
│   ├── types/         # Shared TypeScript types
│   └── config/        # Shared configuration
```

## Auth

| Provider    | Setup needed                          |
|-------------|---------------------------------------|
| Email/pwd   | None (works out of the box)           |
| GitHub      | Set `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET` |
| Google      | Set `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` |

## Environment

Copy `apps/web/.env.example` to `apps/web/.env.local` — the defaults work for local development with SQLite.

## Commands

```bash
npm run dev          # Start all apps
npm run build        # Production build
npm run lint         # Lint all packages
npm run typecheck    # TypeScript check
npm run db:push      # Push schema to database
npm run db:generate  # Regenerate Prisma client
```

## Tech Stack

Next.js 15 · TypeScript · Tailwind CSS v4 · Prisma (SQLite/PostgreSQL) · NextAuth v5 · Turborepo
