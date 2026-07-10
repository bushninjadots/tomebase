# TomeBase — AI Agent Instructions

## Project Context
TomeBase is an AI-powered documentation platform for engineering teams. Monorepo with npm workspaces + Turborepo.

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
- `apps/web/app/globals.css` — Theme CSS variables for 5 themes (light/dark/gruvbox/dracula/nord) + Tailwind `@theme` semantic aliases
- `apps/web/components/theme-provider.tsx` — Multi-theme context with `data-theme` / `.dark` attribute management
- `apps/web/components/theme-selector.tsx` — Dropdown theme picker (replaces old `theme-toggle.tsx`)

## Theme Migration (Remaining Work)
Most visible chrome is themed (dashboard page, editor wrapper, sidebar, graph, notifications, search, welcome help, usage meter). Files still with hardcoded Tailwind colors:
- `apps/web/app/dashboard/[project]/health/page.tsx` — many `text-gray-*`, `bg-amber-*`, `bg-gray-*` throughout
- `apps/web/app/dashboard/[project]/import/` — breadcrumbs use `text-gray-*`
- `apps/web/app/dashboard/[project]/settings/` — breadcrumbs, form borders/buttons use `text-gray-*`, `border-gray-*`
- `apps/web/app/dashboard/new/` — `text-gray-*`
- `apps/web/app/dashboard/settings/` — `text-gray-*`
- `apps/web/components/project-card.tsx` — may still use hardcoded colors
- `apps/web/components/onboarding-checklist.tsx` — may still use hardcoded colors
- `apps/web/components/guided-tutorial.tsx` — may still use hardcoded colors

These are lower-priority because they're inside individual content areas (not chrome chrome). Convert to theme variables when editing those files next.
