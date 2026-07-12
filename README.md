<p align="center">
  <svg viewBox="0 0 32 32" fill="none" width="64" height="64">
    <defs>
      <linearGradient id="logo" x1="0" y1="0" x2="32" y2="32">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stop-color="#a855f7" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#logo)" />
    <circle cx="16" cy="16" r="4" fill="white" />
  </svg>
</p>

<h1 align="center">TomeBase</h1>

<p align="center">
  <strong>Documentation that writes itself.</strong><br/>
  Generate, organize, and publish beautiful engineering docs from your codebase.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#features">Features</a> ·
  <a href="#why-tomebase">Why TomeBase</a> ·
  <a href="https://tomebase.vercel.app/roadmap">Roadmap</a> ·
  <a href="https://github.com/bushninjadots/tomebase/issues">Issues</a>
</p>

<p align="center">
  <a href="https://github.com/bushninjadots/tomebase/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" /></a>
  <img src="https://img.shields.io/badge/Next.js-15-black" alt="Next.js" />
  <img src="https://img.shields.io/badge/Typecript-5.7-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
</p>

---

## Why TomeBase exists

Documentation is the most neglected part of every engineering project. Not because developers don't care — because the tools make it painful.

**The current options all have trade-offs:**

- **GitBook** — great UX, terrible for engineers. Proprietary, expensive, no code integration.
- **Notion** — flexible but not documentation-first. No version control, no code import, no public hosting without workarounds.
- **Docusaurus / MkDocs** — free and open-source, but require build pipelines, CI/CD setup, Markdown file management, and separate hosting. Writing docs means committing to Git.
- **Confluence** — enterprise tax. Slow, cluttered, and nobody actually likes using it.
- **Mintlify** — beautiful, but closed-source SaaS with limited customization and vendor lock-in.

**TomeBase exists because documentation should feel like writing, not deploying.**

The philosophy is simple:

1. **Write in a real editor** — not a text file, not a form. A split-pane Markdown editor with live preview, wiki links, and auto-save.
2. **Import from code** — paste TypeScript, Go, Rust, Python, or an OpenAPI spec. TomeBase generates structured docs automatically.
3. **Publish with one click** — no build step, no hosting config. Toggle publish and your docs are live.
4. **Keep it healthy** — scan for broken links, orphan pages, and empty docs. Know your documentation quality at a glance.
5. **Work as a team** — invite members, leave comments, share pages. Documentation is a team sport.

TomeBase is what happens when you build documentation tools for people who actually write code.

---

## Screenshots

<!-- Replace these with actual screenshots before v1.0 release -->

| Dashboard | Editor | Graph View |
|-----------|--------|------------|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Editor](docs/screenshots/editor.png) | ![Graph](docs/screenshots/graph.png) |

| Public Docs | Import | Health Scan |
|-------------|--------|-------------|
| ![Public](docs/screenshots/public-docs.png) | ![Import](docs/screenshots/import.png) | ![Health](docs/screenshots/health.png) |

| Search | Settings |
|--------|----------|
| ![Search](docs/screenshots/search.png) | ![Settings](docs/screenshots/settings.png) |

---

## Features

### Editor

- **Markdown with live preview** — split-pane editor with real-time rendering, auto-save every 2 seconds, and a formatting toolbar.
- **Wiki links** — `[[Page Name]]` resolves to internal links in preview and published output. Type `[[` for autocomplete.
- **Callout blocks** — 12 styled callout types (`> [!note]`, `> [!tip]`, `> [!warning]`, etc.) with icons and colored backgrounds.
- **Tags** — `#tag` extraction from content, filterable in the sidebar.
- **Backlinks** — footer shows every page that links to the current page.
- **Page templates** — 9 built-in templates (Getting Started, API Reference, Release Notes, Troubleshooting, Architecture, Configuration, Database, Authentication, blank).
- **Version history** — every save creates a snapshot. Browse, compare, and restore any previous version.

### Documentation

- **Hierarchical pages** — nested page tree with drag-free reorder (move up/down, indent/outdent).
- **Page descriptions** — optional metadata for search results and navigation.
- **Bookmarks** — save pages for quick access from the dashboard.
- **Comments & discussions** — threaded inline feedback on pages with @mention support.
- **Revision diff** — side-by-side comparison of any two snapshot versions with line-level highlighting.

### Publishing

- **One-click publish** — toggle per project. Each project gets a public URL at `/p/[project]` with no auth required.
- **Custom domains** — point a CNAME and serve docs from your own domain (Pro tier).
- **SEO** — per-page meta tags, Open Graph, Twitter cards, canonical URLs, and a dynamic sitemap.
- **Public search** — Cmd+K search works on published docs too.
- **Scheduled publishing** — set future publish/unpublish dates on any page.
- **View analytics** — every public page tracks views. Dashboard shows most-viewed pages and total stats.

### Importing

- **Code import** — paste TypeScript, JavaScript, Python, Go, Rust, C#, C++, Kotlin, or Ruby. TomeBase parses functions, interfaces, types, enums, and classes with JSDoc comments into structured Markdown pages.
- **OpenAPI import** — paste JSON/YAML specs or fetch from a URL. Creates one page per endpoint with method, path, parameters, request body, responses, and example code.

### Search

- **Cmd+K palette** — full-text search across titles and content with contextual snippets and keyboard navigation.
- **Graph view** — force-directed visualization of page connections. Local mode highlights the current page's neighborhood; global mode shows every link. Draggable nodes, zoom controls, search filter, legend panel.
- **Cross-project search** — search across all your projects from the dashboard.

### Collaboration

- **Team invites** — share invite links with 7-day expiry. Assign admin or member roles.
- **Inline comments** — leave feedback directly on pages with threaded replies and @mentions.
- **Member management** — view team members, roles, and project access from Team Settings.

### Developer Experience

- **API keys** — generate `tb_`-prefixed keys for programmatic access to your documentation.
- **Webhooks** — trigger webhooks on page create, update, and publish events.
- **REST API** — full API access for creating, reading, updating, and deleting pages and projects.

### Administration

- **Health scans** — scan for broken wiki links, orphan pages, stale content, and empty pages. 12 check categories with per-page scoring.
- **Export** — download all pages as Markdown ZIP with YAML frontmatter, or as HTML.
- **Doc health dashboard** — SonarQube-style score breakdown with historical trends.

### Billing

- **Stripe integration** — automated checkout, customer portal, and webhook handling.
- **Two tiers** — Free (€0) and Pro (€15/month). Upgrade, downgrade, or cancel anytime.
- **Usage metering** — real-time display of projects, pages, and members against tier limits.

### Customization

- **5 themes** — Dark (default), Light, Gruvbox, Dracula, Nord.
- **Theme-aware everything** — all components adapt to the active theme via CSS variables.
- **Project logos** — upload a logo for your published documentation site.

### Security

- **Auth** — email/password, GitHub OAuth, Google OAuth.
- **Rate limiting** — in-memory rate limiter on auth, signup, codegen, and public search endpoints.
- **Input validation** — all API routes validate input, enforce size limits, and check authorization.
- **Security headers** — X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-XSS-Protection, Permissions-Policy.

---

## Why choose TomeBase?

| Feature | TomeBase | Docusaurus | Mintlify | GitBook | Notion | Confluence |
|---------|----------|------------|----------|---------|--------|------------|
| **Self-hosted** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Open-source** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Visual editor** | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Code import** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Wiki links** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Graph view** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Health scans** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Public hosting** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Custom domains** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Team collaboration** | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Stripe billing** | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **API access** | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **No build step** | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Self-contained** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Free tier** | Unlimited pages | Unlimited | Limited | Limited | Limited | Limited |

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL database (Neon free tier works)

### Development

```bash
# Clone the repository
git clone https://github.com/bushninjadots/tomebase.git
cd tomebase

# Install dependencies
npm install

# Set up environment
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local with your DATABASE_URL and AUTH_SECRET

# Push database schema
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up with email/password.

### Production (Vercel + Neon)

```bash
# 1. Create a Neon database at neon.tech
# 2. Deploy to Vercel with environment variables:
#    - DATABASE_URL (from Neon)
#    - AUTH_SECRET (random string)
#    - APP_URL (your Vercel URL)
# 3. Push schema after first deploy:
npm run db:push
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for the complete deployment guide.

---

## Architecture

```
tomebase/
├── apps/
│   └── web/                      # Next.js 15 App Router
│       ├── app/
│       │   ├── api/              # REST API routes
│       │   │   ├── auth/         # NextAuth (credentials, GitHub, Google)
│       │   │   ├── pages/        # CRUD, comments, bookmarks, snapshots
│       │   │   ├── projects/     # Settings, export, health, webhooks, keys
│       │   │   ├── stripe/       # Checkout, portal, webhooks, cancel
│       │   │   ├── team/         # Invite, members, settings
│       │   │   └── ...           # Search, import, codegen, cron
│       │   ├── dashboard/        # Project list, settings, import
│       │   ├── docs/             # Split-pane markdown editor
│       │   ├── p/                # Public documentation hosting
│       │   ├── login/            # Auth (email/password + OAuth)
│       │   └── pricing/          # Pricing page
│       ├── components/           # React components
│       └── lib/                  # Auth, limits, rate limiting, Stripe
├── packages/
│   ├── ui/                       # Shared component library (Button, Input, Card, Badge, Logo, Navigation, Container)
│   ├── utils/                    # Helpers (cn, slugify, truncate)
│   ├── database/                 # Prisma schema + client
│   ├── types/                    # Shared TypeScript types
│   ├── codegen/                  # Code parsers (TS, JS, Python, Go, Rust, C#, C++, Kotlin, Ruby)
│   ├── ai/                       # AI utilities
│   └── config/                   # Shared ESLint + TypeScript config
```

### Data Flow

```
User writes Markdown
    → Editor auto-saves (2s debounce)
    → PageSnapshot created (version history)
    → Wiki links parsed ([[Page Name]] → internal links)
    → Backlinks computed (who links to this page)
    → Health scan runs (broken links, orphans, empties)
    → Toggle publish → public URL live at /p/{project}/{slug}
    → Webhooks fire (page.created, page.updated, page.published)
```

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps in development mode |
| `npm run build` | Production build for all packages |
| `npm run typecheck` | Type-check all packages |
| `npm run lint` | Lint all packages |
| `npm run test` | Run all tests (Vitest) |
| `npm run db:push` | Push schema changes to database |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:seed` | Seed documentation project |
| `npm run format` | Format code with Prettier |

---

## Environment Variables

Copy `apps/web/.env.example` to `apps/web/.env.local`.

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (e.g. from Neon) |
| `AUTH_SECRET` | Random string for NextAuth session encryption |

### Authentication (optional)

| Variable | Description |
|----------|-------------|
| `AUTH_GITHUB_ID` | GitHub OAuth app client ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth app client secret |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |

### Stripe (optional — for Pro tier billing)

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret API key (`sk_test_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `STRIPE_PRO_PRICE_ID` | Stripe Price ID for Pro plan (`price_...`) |

### Deployment (optional)

| Variable | Description |
|----------|-------------|
| `APP_URL` | Public URL (used for sitemap and canonical URLs) |
| `VERCEL_TOKEN` | Vercel API token (for custom domain management) |
| `VERCEL_PROJECT_ID` | Vercel project ID (for custom domain management) |

---

## Contributing

We welcome contributions of all kinds. Here's how to get started.

### Development Setup

```bash
git clone https://github.com/bushninjadots/tomebase.git
cd tomebase
npm install
cp apps/web/.env.example apps/web/.env.local
npm run db:push
npm run dev
```

### Branch Naming

| Prefix | Purpose |
|--------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation changes |
| `refactor/` | Code restructuring without behavior changes |
| `test/` | Adding or updating tests |
| `chore/` | Maintenance tasks |

### Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add C++ code parser
fix: resolve slug collision loop in page creation
docs: update README with architecture diagram
refactor: extract rate limiting into shared middleware
test: add unit tests for health engine
chore: update dependencies
```

### Pull Requests

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Run `npm run typecheck && npm run lint && npm run test`
5. Open a PR with a clear description of what changed and why

### Coding Standards

- **TypeScript strict mode** throughout
- **Server components by default** — client components only for interactivity
- **Tailwind CSS** — use theme CSS variables (`text-theme-*`, `bg-theme-*`) not hardcoded colors
- **Tests** — add tests for new utility functions and API routes
- **No comments** unless explaining non-obvious business logic

### Issue Templates

- **Bug Report** — steps to reproduce, expected behavior, actual behavior
- **Feature Request** — problem description, proposed solution, alternatives considered
- **Question** — what you're trying to do, what you've tried

---

## Roadmap

### Shipped ✅

- Markdown editor with wiki links, callouts, tags, backlinks
- Force-directed graph view
- Full-text search (Cmd+K)
- Public docs hosting with custom domains
- Code import (9 languages) + OpenAPI import
- Team collaboration with invites, comments, @mentions
- Version history with revision diff
- Health scans (12 check categories)
- Stripe billing (Free + Pro)
- 5 themes (Dark, Light, Gruvbox, Dracula, Nord)
- SEO, sitemap, analytics
- Export (Markdown ZIP, HTML)
- Scheduled publishing
- Webhooks + API keys

### In Progress 🚧

- Documentation linter (CI/CD integration)
- Cross-project global search
- Migration tools (GitBook, Mintlify, Docusaurus, Notion)

### Planned 📋

- AI writing assistant
- GitHub/GitLab sync
- Self-hosted Docker deployment
- SSO/SAML
- Audit logs
- Mobile-responsive editor

See [ROADMAP.md](ROADMAP.md) for the complete, up-to-date roadmap.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.7 (strict mode) |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL (Neon) / SQLite (dev) |
| ORM | Prisma 6 |
| Auth | NextAuth v5 |
| Billing | Stripe |
| Monorepo | Turborepo + npm workspaces |
| Testing | Vitest |
| Deployment | Vercel |

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with care by the TomeBase community.
</p>

<p align="center">
  <a href="https://tomebase.vercel.app">Website</a> ·
  <a href="https://github.com/bushninjadots/tomebase/blob/main/ROADMAP.md">Roadmap</a> ·
  <a href="https://github.com/bushninjadots/tomebase/issues">Issues</a> ·
  <a href="https://github.com/bushninjadots/tomebase/discussions">Discussions</a>
</p>
