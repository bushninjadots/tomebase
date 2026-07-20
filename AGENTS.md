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
- `apps/web/lib/stores/` — Zustand stores (App Store, Project Store) + barrel index
- `apps/web/lib/events/` — TypedEventBus, event definitions, logger, React hook
- `apps/web/lib/ai/` — Unified AI service, context manager, streaming client
- `apps/web/app/` — All pages and API routes
- `packages/ui/src/` — UI component library
- `apps/web/app/globals.css` — Theme CSS variables for 5 themes (light/dark/gruvbox/dracula/nord) + Tailwind `@theme` semantic aliases
- `apps/web/components/theme-provider.tsx` — Multi-theme context with `data-theme` / `.dark` attribute management
- `apps/web/components/theme-selector.tsx` — Dropdown theme picker
- `apps/web/app/docs/[project]/chat.tsx` — AI chat panel (placeholder, coming soon)
- `apps/web/vitest.config.ts` — Test configuration
- `apps/web/lib/*.test.ts` — Unit tests for core utilities

## Architecture V2 (Shared Infrastructure)

### Zustand Stores (`apps/web/lib/stores/`)

**App Store** (`app-store.ts`) — Session, theme, toasts, sidebar, command palette, modal.
- `useAppStore(selector)` + 9 exported selectors: `selectSession`, `selectTheme`, `selectToasts`, `selectSidebarOpen`, `selectCommandPaletteOpen`, `selectActiveModal`, `selectIsAuthenticated`, `selectUser`, `selectTier`
- `AppStoreSync` component mirrors ThemeProvider + ToastProvider (bridge, not yet mounted)

**Project Store** (`project-store.ts`) — Project, pages, health, team.
- `useProjectStore(selector)` + 19 exported selectors: `selectProject`, `selectPages`, `selectPageCount`, `selectPublishedPageCount`, `selectTotalViews`, `selectHealth`, `selectHealthScore`, `selectDiagnostics`, `selectTeamMembers`, `selectIsLoading`, `selectIsHealthLoading`, `selectIsTeamLoading`, `selectError`, `selectHealthError`, `selectPage(id)`, `selectPageBySlug(slug)`, `selectPublishedPages`, `selectStaleData`, `selectPageTree`
- Types: `StoreProject`, `StorePage`, `StoreHealth`, `StoreTeamMember`, `StorePageTreeNode`

**Document Store** (`document-store.ts`) — Editor state mirror for validation (read-only, editor owns its own state).
- `useDocumentStore(selector)` + 18 exported selectors: `selectDocumentPage`, `selectDocumentTitle`, `selectDocumentContent`, `selectDocumentSavedTitle`, `selectDocumentSavedContent`, `selectDocumentIsDirty`, `selectDocumentSaveStatus`, `selectDocumentIsSaving`, `selectDocumentDraftAvailable`, `selectDocumentCursor`, `selectDocumentSelection`, `selectDocumentSnapshots`, `selectDocumentSnapshotsLoading`, `selectDocumentWordCount`, `selectDocumentCharCount`, `selectDocumentReadingTime`, `selectDocumentHasPage`
- Types: `DocumentPage`, `DocumentSnapshot`, `DocumentCursor`, `DocumentSelection`, `SaveStatus`

**Barrel** (`index.ts`) — Re-exports all stores, selectors, and types.

### Event Bus (`apps/web/lib/events/`)

- `eventBus` singleton (TypedEventBus) — 30 typed events covering project/page CRUD, health scan, team, editor, chat, AI, publishing, billing, search
- `useEvent(event, handler)` — React hook for subscribing to events
- `enableEventLogger()` — Dev-only console logger for all events

### Unified AI Service (`apps/web/lib/ai/`)

One backend for all AI features (Editor AI, Spirit, Health AI, future features). UI differs, backend does not.

**Service** (`service.ts`) — Singleton `aiService` with `chat()` and `stream()` methods.
- `chat(request)` — Non-streaming: sends to `/api/ai/chat`, returns `AIResponse`
- `stream(request, callbacks)` — Streaming: sends to `/api/ai/chat/stream` with automatic SSE parsing + non-streaming fallback
- `AIOperation` types: `chat`, `explain`, `fix`, `rewrite`, `generate`, `review`, `summarize`, `improve`

**Context Manager** (`context.ts`) — Shared context contributions from any feature.
- `registerContextProvider(key, provider)` — Feature registers context to include in AI prompts
- `collectContext()` — Gathers all registered contributions, sorted by priority
- `contributionsToString()` — Serializes contributions into system prompt sections
- Any feature (editor, health, Spirit) can contribute context that all other features see

**Streaming Client** (`streaming.ts`) — One implementation for all consumers.
- `streamChat(request, callbacks)` — SSE parser with `onChunk`, `onDone`, `onError`
- `streamChatWithFallback(request, fallback, callbacks)` — Tries streaming, falls back to non-streaming
- Replaces duplicated SSE code in AIPanel, SpiritChat, AIActionHandler

**Types** (`types.ts`) — Unified type definitions.
- `AIMessage` (`{ role, content }`), `AIRequest`, `AIResponse`, `AIOperation`
- `AIContextContribution`, `AIContextProvider`, `AIProviderConfig`

**Existing AI code is NOT modified.** AIPanel, SpiritChat, AIActionHandler continue using `useAI()` hook and API routes. The unified service sits alongside, ready for migration.

### Old providers are NOT modified
Existing ThemeProvider, ToastProvider, AIProviderProvider, SessionProvider continue working. The new stores sit alongside old code.

## Theme System
All UI should use theme CSS variables for colors:
- Text: `text-theme-main`, `text-theme-subtle`, `text-theme-muted`
- Backgrounds: `bg-theme-page`, `bg-theme-card`, `bg-theme-hover`
- Borders: `border-theme-border`
- Accent: `text-theme-accent`, `bg-theme-accent-light`
- Semantic colors (green/red/amber/blue) are kept as-is for success/error/warning/info states
