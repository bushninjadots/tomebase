# Architecture

Fluid follows Clean Architecture principles within a monorepo structure.

## Overview

```
apps/web          — Next.js 15 app (presentation layer)
packages/ui       — Reusable UI components (React + Tailwind)
packages/database — Data access layer (Prisma ORM)
packages/ai       — AI integration (OpenAI SDK)
packages/utils    — Shared utilities
packages/types    — Shared TypeScript types
packages/config   — Shared configuration presets
```

## Key Decisions

### Monorepo with npm workspaces + Turborepo
- Shared packages for type safety and DRY
- Turborepo for efficient caching and pipeline orchestration

### Next.js 15 App Router
- Server components by default for performance
- Client components only where interactivity is needed
- API routes for backend functionality

### Prisma ORM
- Type-safe database access
- SQLite for development simplicity
- PostgreSQL support for production
- Migration-based schema management

### NextAuth v5
- OAuth-first authentication
- Prisma adapter for user persistence
- Session-based auth with JWT

### Tailwind CSS v4
- Utility-first CSS framework
- Custom design tokens for Fluid brand
- Consistent spacing, typography, and color system

## Data Flow

1. User authenticates via OAuth (GitHub/Google)
2. Session managed by NextAuth, persisted via Prisma
3. User creates/manages documentation projects
4. Documentation pages stored in database via Prisma
5. AI chat queries documentation context + OpenAI API
6. All API routes are server-side only (no client secrets exposed)
