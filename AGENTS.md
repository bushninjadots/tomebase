# Fluid — AI Agent Instructions

## Project Context
Fluid is an AI-powered documentation platform for engineering teams. Monorepo with npm workspaces + Turborepo.

## Commands

```bash
npm run dev       # Start all apps in dev mode
npm run build     # Build all packages
npm run typecheck # Type-check all packages
npm run lint      # Lint all packages
npm run db:push   # Push schema changes to database
npm run db:generate # Regenerate Prisma client
```

## Architecture
- `apps/web/` — Next.js 15 App Router
- `packages/*` — Shared libraries (ui, utils, types, database, ai, config)
- Database: SQLite (dev) / PostgreSQL (prod) via Prisma
- Auth: NextAuth v5 (GitHub, Google)
- AI: OpenAI via Vercel AI SDK

## Conventions
- Strict TypeScript throughout
- Server components by default
- Client components only for interactivity
- Tailwind CSS v4 for styling
- All packages import directly from TypeScript source (no build step for packages)
- Auth is handled via server actions

## Key Files
- `packages/database/prisma/schema.prisma` — Database schema
- `apps/web/lib/auth.ts` — Auth configuration
- `apps/web/app/` — All pages and API routes
- `packages/ui/src/` — UI component library
