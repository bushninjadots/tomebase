# Roadmap

> This document tracks what's built, what's in progress, and what's planned for TomeBase.
> Last updated: July 2026.

---

## ✅ Complete

### Core Platform

- [x] Monorepo with Turborepo + npm workspaces
- [x] Next.js 15 App Router with TypeScript strict mode
- [x] Tailwind CSS v4 with 5 theme support (Dark, Light, Gruvbox, Dracula, Nord)
- [x] Server components by default, client components for interactivity
- [x] Prisma ORM with PostgreSQL (production) / SQLite (development)
- [x] Email/password authentication (NextAuth v5)
- [x] GitHub OAuth integration
- [x] Google OAuth integration

### Editor

- [x] Split-pane Markdown editor with live preview
- [x] Auto-save every 2 seconds
- [x] Formatting toolbar (bold, italic, headings, links, code, tables, dividers, task lists)
- [x] Wiki links — `[[Page Name]]` with autocomplete
- [x] Wiki link aliases — `[[Page|display text]]`
- [x] Backlinks panel (shows pages linking to current page)
- [x] Obsidian-style callout blocks (12 types: note, tip, warning, danger, etc.)
- [x] Tag extraction (`#tag`) with sidebar filtering
- [x] Page templates (9 built-in: Getting Started, API Reference, Release Notes, etc.)
- [x] Version history with snapshot browse and restore
- [x] Revision diff — side-by-side comparison of any two snapshots
- [x] Tab/Shift+Tab for indent/outdent
- [x] Cmd+K for link insertion

### Documentation

- [x] Hierarchical page tree with reorder (move up/down, indent/outdent)
- [x] Page descriptions (optional metadata)
- [x] Bookmarks — save pages for quick access from dashboard
- [x] Comments and threaded discussions on pages
- [x] @mention support with autocomplete in comments
- [x] Comment highlighting when mentioned

### Publishing

- [x] One-click publish toggle per project
- [x] Public URL at `/p/{project}` with sidebar navigation
- [x] Custom domains (DNS verification + SSL via Vercel API)
- [x] SEO — dynamic sitemap, canonical URLs, Open Graph, Twitter cards
- [x] Public search (Cmd+K on published docs)
- [x] Scheduled publishing (future publish/unpublish dates)
- [x] View analytics (per-page counter, dashboard stats, Most Viewed)

### Importing

- [x] Code import — TypeScript, JavaScript, Python, Go, Rust, C#, C++, Kotlin, Ruby
- [x] JSDoc comment parsing into Markdown documentation
- [x] OpenAPI spec import (JSON/YAML, URL fetch, one page per endpoint)

### Search & Navigation

- [x] Cmd+K search palette (full-text, title + content, snippets, keyboard nav)
- [x] Force-directed graph view (local/global modes, drag, zoom, legend)
- [x] Graph search filter
- [x] Graph legend panel

### Team & Collaboration

- [x] Team invites with 7-day expiry links
- [x] Admin and member roles
- [x] Member management in Team Settings
- [x] Team name editing

### Administration

- [x] Health scans — 12 check categories (broken links, orphans, stale, empty, etc.)
- [x] Per-page health scoring
- [x] Health report persistence and historical tracking
- [x] Export — Markdown ZIP with YAML frontmatter, HTML
- [x] API key generation (`tb_`-prefixed)
- [x] Webhook configuration (page.created, page.updated, page.published)

### Billing

- [x] Stripe integration (Checkout + Customer Portal + webhooks)
- [x] Two tiers: Free (€0) + Pro (€15/month)
- [x] Cancel at period end (not immediate)
- [x] Usage metering (projects, pages, members)
- [x] Upgrade prompt for free users on dashboard
- [x] Success banner after checkout

### Security

- [x] Rate limiting on auth, signup, codegen, and public search endpoints
- [x] SSRF protection on OpenAPI URL imports
- [x] Authorization checks on all API routes
- [x] Input validation and size limits
- [x] Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-XSS-Protection, Permissions-Policy)
- [x] CSRF protection via SameSite cookies
- [x] bcrypt password hashing (12 rounds)

### Developer Experience

- [x] REST API for pages, projects, teams, search
- [x] Full-text search API
- [x] Code generation API (parse code → documentation pages)
- [x] Health scan API (trigger scans, retrieve results)
- [x] Webhook notifications for page events
- [x] API key authentication

---

## 🚧 In Progress

### Documentation Health Platform

- [x] Health engine with 12 check categories
- [x] Health report persistence via Prisma
- [x] Health dashboard with SonarQube-style UI
- [x] Health scan API endpoints
- [ ] Code snippet validation (broken code blocks, missing language tags)
- [ ] Image validation (check referenced images exist)
- [ ] Terminology consistency checks
- [ ] Accessibility checks (heading hierarchy, alt text, link text)
- [ ] Scheduled health scans (cron job)

### Code Import Expansion

- [x] TypeScript / JavaScript parser
- [x] Python parser
- [x] Go parser
- [x] Rust parser
- [x] C# parser
- [x] C++ parser
- [x] Kotlin parser
- [x] Ruby parser
- [ ] Java parser
- [ ] PHP parser
- [ ] Swift parser

---

## 📋 Planned

### Documentation Tools

- [ ] **Documentation Linter** — ESLint for docs with CI/CD integration and PR checks
- [ ] **Documentation Observatory** — Cross-platform dashboard monitoring GitHub, Mintlify, Notion, internal wikis
- [ ] **Documentation Testing** — Validate commands, API endpoints, code compilation, example execution
- [ ] **Global search across all projects** — Cross-project search from dashboard

### Migration & Import

- [ ] **Migration tool** — Import from GitBook, Mintlify, Docusaurus, MkDocs, Obsidian, Notion
- [ ] **GitHub/GitLab sync** — Connect repos and auto-import/sync `.md` files

### AI

- [ ] **AI writing assistant** — Generate, rewrite, and improve documentation with AI
- [ ] **AI-powered search** — Semantic search across documentation
- [ ] **AI health suggestions** — Automatic fix suggestions for health issues

### Developer Experience

- [ ] **CLI tool** — Command-line interface for import, export, and management
- [ ] **Plugin system** — Custom blocks, themes, and integrations
- [ ] **Marketplace** — Community templates and themes
- [ ] **SDK** — JavaScript/TypeScript SDK for API access

### Collaboration

- [ ] **Email notifications** — Alerts for comments, @mentions, and invite responses
- [ ] **Read-only sharing links** — Share pages with non-members
- [ ] **Page-level permissions** — Control who can view/edit specific pages

### Self-Hosting

- [ ] **Docker Compose** — One-command self-hosted deployment with PostgreSQL
- [ ] **Docker image** — Published to Docker Hub / GHCR
- [ ] **Helm chart** — Kubernetes deployment

### Enterprise

- [ ] **SSO/SAML** — Single sign-on with identity providers
- [ ] **Audit log** — Track all changes and access for compliance
- [ ] **SOC 2 compliance** — Enterprise security certifications
- [ ] **Multi-region edge delivery** — Fast global docs hosting

### Mobile

- [ ] **Mobile-responsive editor** — Full editing experience on tablets
- [ ] **Mobile-responsive public docs** — Optimized reading experience on phones

### Analytics

- [ ] **Advanced analytics** — Traffic sources, popular pages, search queries
- [ ] **Health trend charts** — Visualize documentation quality over time
- [ ] **Team activity feed** — See what teammates are editing

---

## 💡 Ideas

These are directions we're exploring for the future:

- **Real-time collaboration** — Google Docs-style simultaneous editing
- **Version branching** — Create branches of documentation for different versions
- **A/B testing for docs** — Test different documentation layouts
- **Voice-to-docs** — Record audio and generate documentation
- **Screenshot automation** — Auto-capture and update screenshots in docs
- **Code playground** — Interactive code examples that run in the browser
- **Translation** — Multi-language documentation support
- **RSS feeds** — Subscribe to documentation updates
- **Embeddable widgets** — Embed documentation snippets in other apps
- **Slack/Discord integration** — Search docs from chat

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full release history.
