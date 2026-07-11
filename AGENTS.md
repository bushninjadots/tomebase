# TomeBase — AI Agent Instructions

## Project Context
TomeBase is an AI-powered documentation platform for engineering teams. Monorepo with npm workspaces + Turborepo.

## Commands

```bash
npm run dev         # Start all apps in dev mode
npm run build       # Build all packages
npm run typecheck   # Type-check all packages
npm run lint        # Lint all packages
npm run test        # Run all tests (Vitest)
npm run db:push     # Push schema changes to database
npm run db:generate # Regenerate Prisma client
```

## Architecture
- `apps/web/` — Next.js 15 App Router
- `packages/*` — Shared libraries (ui, utils, types, database, ai, config)
- Database: SQLite (dev) / PostgreSQL (prod) via Prisma
- Auth: NextAuth v5 (GitHub, Google)
- AI: OpenAI via Vercel AI SDK
- Tests: Vitest (unit/integration)
- Billing: Stripe (Checkout + Customer Portal + webhooks)
- Pricing: 2 tiers — Free (€0) + Pro (€15/mo)

## Conventions
- Strict TypeScript throughout
- Server components by default
- Client components only for interactivity
- Tailwind CSS v4 for styling
- All packages import directly from TypeScript source (no build step for packages)
- Auth is handled via server actions
- Use theme CSS variables (`text-theme-*`, `bg-theme-*`, `border-theme-*`) instead of hardcoded Tailwind colors

## Key Files
- `packages/database/prisma/schema.prisma` — Database schema
- `apps/web/lib/auth.ts` — Auth configuration
- `apps/web/lib/limits.ts` — Tier definitions and limit checks (Free/Pro)
- `apps/web/lib/authorization.ts` — Auth + team membership helpers
- `apps/web/lib/rate-limit.ts` — In-memory rate limiter
- `apps/web/lib/stripe.ts` — Stripe SDK singleton
- `apps/web/app/` — All pages and API routes
- `packages/ui/src/` — UI component library
- `apps/web/app/globals.css` — Theme CSS variables for 5 themes (light/dark/gruvbox/dracula/nord) + Tailwind `@theme` semantic aliases
- `apps/web/components/theme-provider.tsx` — Multi-theme context with `data-theme` / `.dark` attribute management
- `apps/web/components/theme-selector.tsx` — Dropdown theme picker
- `apps/web/app/docs/[project]/chat.tsx` — AI chat panel (placeholder, coming soon)
- `apps/web/vitest.config.ts` — Test configuration
- `apps/web/lib/*.test.ts` — Unit tests for core utilities

## Theme System
All UI should use theme CSS variables for colors:
- Text: `text-theme-main`, `text-theme-subtle`, `text-theme-muted`
- Backgrounds: `bg-theme-page`, `bg-theme-card`, `bg-theme-hover`
- Borders: `border-theme-border`
- Accent: `text-theme-accent`, `bg-theme-accent-light`
- Semantic colors (green/red/amber/blue) are kept as-is for success/error/warning/info states
