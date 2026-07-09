# Fluid

**Knowledge that flows into action.**

Fluid is an AI-powered documentation platform for modern engineering teams. Auto-generate beautiful API docs, chat with your codebase, and keep knowledge in flow.

## Features

- **Auto-Generated API Docs** — Connect your codebase and Fluid generates beautiful, searchable documentation
- **AI Chat Over Docs** — Ask questions about your documentation and get instant answers
- **Semantic Search** — AI-powered search that understands intent, not just keywords
- **MDX Support** — Write docs in Markdown with embedded interactive components
- **Version Control** — Every change tracked with diff views and rollback support
- **API Playground** — Interactive API testing directly from documentation
- **Team Collaboration** — Real-time editing, comments, and approval workflows

## Architecture

```
fluid/
├── apps/
│   └── web/           Next.js 15 application (App Router)
├── packages/
│   ├── ai/            OpenAI/AI SDK client wrapper
│   ├── config/        Shared TypeScript, ESLint, Tailwind configs
│   ├── database/      Prisma ORM with SQLite (dev) / PostgreSQL (prod)
│   ├── types/         Shared TypeScript types
│   ├── ui/            Component library (React, Tailwind CSS)
│   └── utils/         Shared utilities (cn, slugify, formatters)
├── docs/              Project documentation
└── turbo.json         Turborepo pipeline config
```

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| UI Library | Custom components in `@fluid/ui` |
| Database | SQLite (dev) / PostgreSQL (prod) via Prisma |
| Auth | NextAuth v5 (GitHub, Google) |
| AI | OpenAI SDK via Vercel AI SDK |
| Monorepo | Turborepo + npm workspaces |

## Getting Started

### Prerequisites

- Node.js >= 20
- npm

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Start development
npm run dev
```

The web app will be available at `http://localhost:3000`.

### Environment Variables

Copy `.env.example` from `apps/web/` and configure:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Required variables:
- `AUTH_SECRET` — Random string for session encryption
- `OPENAI_API_KEY` — OpenAI API key (for AI features)

Optional (for OAuth):
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`

## Development

```bash
# Start all apps in dev mode
npm run dev

# Type check all packages
npm run typecheck

# Lint all packages
npm run lint

# Build all packages
npm run build
```

## Deployment

The web app can be deployed to any platform supporting Next.js (Vercel, Railway, Docker).

For production database, replace SQLite with PostgreSQL by updating `packages/database/prisma/schema.prisma` and setting `DATABASE_URL`.

## Monetization

Fluid uses a tiered SaaS model:
1. **Free** — 3 projects, 50 pages/project, limited AI
2. **Pro ($29/mo)** — Unlimited projects/pages, full AI, API playground
3. **Enterprise (Custom)** — SSO, audit logs, self-hosted, SLA

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full roadmap.

## License

MIT
