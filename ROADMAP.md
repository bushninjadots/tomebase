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
- [x] Tier limits (Free/Pro/Enterprise) with usage metering
- [x] Pricing page with comparison table

## v2 — Next

### High Priority

- [x] **Revision diff** — side-by-side comparison of snapshot versions
- [x] **Page comments / discussions** — inline feedback on pages with @mentions
- [ ] **Stripe billing** — real payment integration for Pro/Enterprise upgrades
- [ ] **AI writing assistant** — smart suggestions, auto-summarize, rewrite

### Medium Priority

- [ ] **GitHub/GitLab sync** — connect a repository, auto-import and sync `.md` files
- [ ] **Webhook notifications** — trigger webhooks on page create/update/publish
- [ ] **Scheduled publishing** — set future publish/unpublish dates
- [ ] **Bookmarks** — save pages for quick access from the dashboard
- [ ] **Guided tutorial** — interactive walkthrough for first-time users

### Low Priority

- [ ] **SSO/SAML** — enterprise single sign-on
- [ ] **Audit log** — track all changes and access for compliance
- [ ] **Read-only sharing links** — share a page with non-members
- [ ] **Mobile responsive editor** — write docs from tablets
- [ ] **Self-hosted deployment** — Docker Compose with PostgreSQL
- [ ] **Multi-region edge delivery** — fast global docs hosting
- [ ] **Plugin system** — custom blocks, themes, integrations
- [ ] **Marketplace** — community templates and themes
- [ ] **SOC 2 compliance** — enterprise security certifications

## Changelog

### 2026-07-10
- Page comments/discussions with threaded replies
- @mention support with autocomplete dropdown
- Comment highlighting when mentioned
- Delete own comments
- Comments section toggle in editor

### 2026-07-10
- Revision diff: compare any two snapshots side-by-side with line-by-line diff view
- History modal: toggle compare mode to select two versions and see changes
- Diff viewer shows added/removed/unchanged lines with color coding
- Added diff summary (+/- lines) between snapshots in history list
- Wiki links: support aliases ([[Page|display text]])
- Wiki autocomplete: fuzzy matching, page descriptions, sorted results
- Graph view: improved physics, arrow markers, shadows, glow effects
- Markdown editor: added table, divider, task list toolbar buttons
- Markdown editor: Tab/Shift+Tab for indent/outdent
- Markdown editor: Cmd+K for link insertion
- Landing page: removed fake stats, replaced with accurate tier info

### 2026-07-09
- Page version history with snapshot browse/restore
- Landing page redesign with hero, stats, pricing
- Onboarding checklist for new dashboard users
- Public search on published docs
- SEO: dynamic sitemap, canonical URLs
- Doc health checks (broken links, orphans, empty pages)
- Export to Markdown ZIP
- View analytics and Most Viewed dashboard section
- Custom domain UI and middleware
- History button in editor toolbar
- All 43 routes building clean
