# Roadmap

## v1 — Shipped

- [x] Auth (email/password, GitHub OAuth, Google OAuth)
- [x] Dashboard with stats, usage meter, project cards
- [x] Markdown editor with split pane, live preview, auto-save, formatting toolbar
- [x] Wiki links (`[[Page Name]]`) with autocomplete
- [x] Hierarchical page tree with reorder and indent/outdent
- [x] Page templates (9 built-in templates with cross-linking)
- [x] Full-text search (Cmd+K palette, title + content, snippets)
- [x] Force-directed graph view (local/global, drag, zoom, legend)
- [x] Obsidian-style callout blocks (12 types with icons)
- [x] Tags — `#tag` extraction and sidebar filtering
- [x] Backlinks panel
- [x] Public docs hosting with sidebar navigation
- [x] Custom domains (DNS instructions UI + middleware rewrite)
- [x] Page view analytics (counter, dashboard stats, Most Viewed)
- [x] Version history (snapshots on save, browse and restore)
- [x] Team invites with roles (admin/member, 7-day links)
- [x] API key management
- [x] OpenAPI spec import (JSON/YAML, one page per endpoint)
- [x] Code import (TypeScript/JavaScript JSDoc → Markdown)
- [x] Export to Markdown (`.zip` with YAML frontmatter)
- [x] Doc health scans (broken links, orphans, empty pages)
- [x] SEO — dynamic sitemap, canonical URLs, Open Graph, Twitter cards
- [x] Public search (Cmd+K on published docs)
- [x] Landing page with stats and pricing section
- [x] Onboarding checklist for new users
- [x] Tier limits (Free/Pro) with usage metering
- [x] Pricing page with comparison table

## v2 — Shipped

- [x] **Revision diff** — side-by-side comparison of snapshot versions
- [x] **Page comments / discussions** — inline feedback on pages with @mentions
- [x] **Stripe billing** — real payment integration for Pro tier (Checkout + Customer Portal + webhooks)
- [x] **Bookmarks** — save pages for quick access from the dashboard
- [x] **Scheduled publishing** — set future publish/unpublish dates
- [x] **Webhook notifications** — trigger webhooks on page create/update/publish
- [x] **Guided tutorial** — interactive walkthrough for first-time users
- [x] **Security hardening** — rate limiting, SSRF protection, authorization on all API routes, input validation
- [x] **CI/CD** — GitHub Actions workflow (typecheck + lint + build)
- [x] **2-tier pricing** — Free (€0) + Pro (€15/mo), removed Enterprise tier

## v3 — Documentation Health Platform (In Progress)

The "SonarQube for documentation" — comprehensive health analysis platform that complements existing documentation platforms.

### Health Platform — Core

- [ ] **Enhanced health engine** — 10+ check categories (broken links, orphans, stale pages, code quality, content structure, reading time)
- [ ] **Health report persistence** — Database model for storing scan results over time
- [ ] **Health dashboard redesign** — SonarQube-style with score breakdown and category cards
- [ ] **Health scan API** — POST endpoint to trigger scans, GET for results
- [ ] **Historical health trends** — track health score changes over time

### Health Platform — Advanced Features (Next)

- [ ] **Code snippet validation** — detect broken code blocks, missing language tags, compilation issues
- [ ] **Image validation** — check referenced images exist
- [ ] **Terminology consistency** — detect inconsistent naming across pages
- [ ] **Accessibility checks** — heading hierarchy, alt text, link text quality
- [ ] **Scheduled health scans** — cron job for periodic analysis
- [ ] **Health badges/widgets** — summary displays on project dashboards

## v3 — Next

### High Priority

- [ ] **Documentation Linter** — ESLint for docs with CI/CD integration and PR checks
- [ ] **Documentation Observatory** — Cross-platform dashboard monitoring GitHub, Mintlify, Notion, internal wikis
- [ ] **Documentation Testing** — Validate commands, API endpoints, code compilation, example execution
- [ ] **GitHub/GitLab sync** — Connect repositories and auto-import/sync `.md` files
- [ ] **Global search across all projects** — Cross-project search functionality from dashboard

### Medium Priority

- [ ] **Migration tool** — Import documentation from GitBook, Mintlify, Docusaurus, MkDocs, Obsidian, Notion
- [ ] **Mobile responsive public docs and editor** — Full documentation editing experience on tablets
- [ ] **Email notifications** — Alerts for comments, @mentions, and invite responses
- [ ] **Self-hosted deployment** — Docker Compose setup with PostgreSQL

### Low Priority

- [ ] **SSO/SAML** — Single sign-on capabilities
- [ ] **Audit log** — Track all changes and access for compliance
- [ ] **Read-only sharing links** — Share pages with non-members
- [ ] **Multi-region edge delivery** — Fast global docs hosting infrastructure
- [ ] **Plugin system** — Custom blocks, themes, and integrations
- [ ] **Marketplace** — Community templates and themes
- [ ] **SOC 2 compliance** — Enterprise security certifications

## Changelog

### 2026-07-11 — Documentation Health Platform Launch

- Documentation Health Platform — roadmap and architecture defined
- Health engine with 10+ check categories (broken links, orphans, stale pages, code quality, content structure, reading time)
- Health report persistence via Prisma model for historical tracking
- Health dashboard redesign with SonarQube-style UI
- Health scan API endpoints (trigger scans, retrieve results)
- Planning: Documentation Linter, Observatory, Migration Tool, Documentation Testing
- Auth fix: added SessionProvider for client-side signIn
- ESLint fixes: react-hooks/exhaustive-deps warnings resolved

### 2026-07-11 — Stripe Billing Integration

- Stripe billing integration: Checkout sessions, Customer Portal, webhook handlers
- 2-tier pricing model: Free (€0) + Pro (€15/mo), removed Enterprise tier
- Security hardening: rate limiting, SSRF protection, authorization guards, input validation
- CI/CD: GitHub Actions workflow (typecheck + lint + build)
- Theme migration: dashboard, settings, import, project cards, onboarding, guided tutorial, public pages
- Test infrastructure: Vitest setup with core utility tests
- AI chat panel: placeholder UI for future writing assistant functionality

### 2026-07-10 — New Features & Improvements

- Bookmarks: save pages for quick access from dashboard
- Scheduled publishing: set future publish/unpublish dates on pages
- Webhook notifications: configure webhooks for page create/update/publish/delete events
- Guided tutorial: interactive walkthrough for first-time users
- Sidebar/editor UI redesign: collapsible creation, template modal, side panel comments

### 2026-07-10 — Comments & Diff Features

- Page comments/discussions with threaded replies
- @mention support with autocomplete dropdown
- Comment highlighting when mentioned
- Delete own comments
- Comments section toggle in editor

### 2026-07-10 — Revision Diff & Wiki Enhancements

- Revision diff: compare any two snapshots side-by-side with line-by-line diff view
- History modal: toggle compare mode to select two versions and see changes
- Diff viewer shows added/removed/unchanged lines with color coding
- Added diff summary (+/- lines) between snapshots in history list
- Wiki links: support aliases ([[Page|display text]])
- Wiki autocomplete: fuzzy matching, page descriptions, sorted results

### 2026-07-10 — Enhanced Editor & Landing Page

- Graph view: improved physics, arrow markers, shadows, glow effects
- Markdown editor: added table, divider, task list toolbar buttons
- Markdown editor: Tab/Shift+Tab for indent/outdent
- Markdown editor: Cmd+K for link insertion
- Landing page: removed fake stats, replaced with accurate tier information

### 2026-07-09 — Initial Launch Features

- Page version history with snapshot browse/restore functionality
- Landing page redesign with hero section, statistics, pricing
- Onboarding checklist for new dashboard users
- Public search on published documentation
- SEO: dynamic sitemap, canonical URLs, Open Graph, Twitter cards
- Doc health checks (broken links, orphans, empty pages)
- Export to Markdown ZIP archive
- View analytics and Most Viewed dashboard section
- Custom domain UI and middleware functionality
- History button in editor toolbar
- All 43 routes building successfully
