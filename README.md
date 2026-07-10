# TomeBase

**Your knowledge base.**

TomeBase is an open-source documentation platform for engineering teams. It
generates docs from code, publishes to the web, and keeps teams in sync —
without build steps, separate hosting, or configuration overhead.

## Who is this for?

- **Engineering teams** that need living documentation that stays in sync with
  their codebase.
- **API providers** who want to import OpenAPI specs and generate endpoint docs
  automatically.
- **Startups** that want a polished docs site without paying for a SaaS product
  or managing a static site generator.
- **OSS maintainers** who need project documentation with search, wiki links, and
  public hosting out of the box.

## Features

### Editor

- **Markdown** with live preview, auto-save (2s debounce), and formatting
  toolbar.
- **Wiki links** — `[[Page Name]]` resolves to internal links in preview and
  published output.
- **Split pane** — toggle between edit, preview, and side-by-side.
- **Page templates** — blank, Getting Started, API Reference, Release Notes,
  Troubleshooting, Architecture, Configuration, Database, Authentication.
- **Version history** — every save creates a snapshot; browse and restore
  previous versions from the editor.
- **Callout blocks** — `> [!note]`, `> [!tip]`, `> [!warning]`, `> [!danger]`,
  and 8 more — rendered as styled colored boxes.
- **Tags** — `#tag` extracted from content, filterable in the sidebar.
- **Wiki autocomplete** — type `[[` to see matching page titles with keyboard
  navigation.
- **Backlinks** — footer shows every page that links to the current page.

### Search & Navigation

- **Cmd+K palette** — full-text search across titles and content with contextual
  snippets and keyboard navigation.
- **Graph view** — force-directed visualization of page connections. Local mode
  highlights the current page's neighborhood; global mode shows every link.
  Draggable nodes, zoom controls, search filter, legend panel.
- **Hierarchical sidebar** — nested page tree with drag-free reorder (move
  up/down, indent/outdent).

### Imports

- **Code import** — paste TypeScript/JavaScript; TomeBase parses functions,
  interfaces, types, enums, and classes into structured Markdown pages.
- **OpenAPI import** — paste JSON/YAML specs or fetch from a URL. Creates one
  page per endpoint with method, path, parameters, request body, responses,
  and example code.

### Publishing

- **Public hosting** — toggle publish per project; each project gets a public
  URL at `/p/[project]` with no auth required.
- **Custom domains** — point a CNAME and serve docs from your own domain (Pro
  and Enterprise).
- **SEO** — per-page meta tags, Open Graph, Twitter cards, canonical URLs, and a
  dynamic sitemap.
- **View analytics** — every public page tracks views; dashboard shows most
  viewed pages and total stats.
- **Public search** — Cmd+K search works on published docs too.

### Team & Administration

- **Auth** — email/password out of the box; GitHub and Google OAuth when
  credentials are configured.
- **Team invites** — share invite links with 7-day expiry; assign admin or
  member roles.
- **API keys** — generate `tb_`-prefixed keys for programmatic access to your
  documentation.
- **Doc health** — scan for broken wiki links, orphan pages (zero inbound
  links), and empty pages.
- **Export** — download all pages as `.zip` of Markdown files with YAML
  frontmatter.

### Team & Administration

## Quick Start

```bash
npm install
npm run db:push
npm run db:generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up with
email/password.

> **Note:** SQLite is used in development. For production, set `DATABASE_URL` to
> a PostgreSQL connection string in `apps/web/.env.local`.

## Architecture

```
tomebase/
├── apps/
│   └── web/                  # Next.js 15 App Router
│       ├── app/
│       │   ├── api/          # API routes (auth, pages, projects, teams, import, export, health, etc.)
│       │   ├── dashboard/    # Dashboard, project settings, import, health
│       │   ├── docs/         # Editor (split-pane markdown editor)
│       │   ├── p/            # Public docs hosting
│       │   ├── login/        # Auth pages
│       │   └── page.tsx      # Marketing / landing page
│       └── components/       # React components (search, graph, markdown, history, etc.)
├── packages/
│   ├── ui/                   # Shared UI components
│   ├── utils/                # Helpers (cn, slugify, truncate)
│   ├── database/             # Prisma schema + client
│   ├── types/                # Shared TypeScript types
│   └── config/               # Shared configuration (ESLint, TypeScript)
```

## Commands

| Command             | Description              |
|---------------------|--------------------------|
| `npm run dev`       | Start all apps (dev)     |
| `npm run build`     | Production build         |
| `npm run lint`      | Lint all packages        |
| `npm run typecheck` | TypeScript check         |
| `npm run db:push`   | Push schema to database  |
| `npm run db:generate` | Regenerate Prisma client |

## Project Documentation

The user-facing product documentation is maintained in two places:

- **In-app** — a "TomeBase Docs" project inside the app (published at `/p/tomebase-docs`). Run `npm run db:seed` to create or refresh it.
- **Markdown files** — the same content in `docs/usage/` as plain Markdown for editing on GitHub.

The `/docs` page on the site pulls from the in-app project and links to the GitHub source.

## Environment

Copy `apps/web/.env.example` → `apps/web/.env.local`. Defaults work for local
development with SQLite.

| Variable               | Required | Description                     |
|------------------------|----------|---------------------------------|
| `DATABASE_URL`         | Yes      | Prisma connection string        |
| `AUTH_SECRET`          | Yes      | NextAuth encryption secret      |
| `AUTH_GITHUB_ID`       | No       | GitHub OAuth app ID             |
| `AUTH_GITHUB_SECRET`   | No       | GitHub OAuth app secret         |
| `AUTH_GOOGLE_ID`       | No       | Google OAuth client ID          |
| `AUTH_GOOGLE_SECRET`   | No       | Google OAuth client secret      |
| `APP_URL`              | No       | Public URL (used for sitemap)   |

## Tech Stack

Next.js 15 · TypeScript · Tailwind CSS v4 · Prisma (SQLite / PostgreSQL) ·
NextAuth v5 · Turborepo · npm workspaces

## License

MIT — see [LICENSE](LICENSE).
