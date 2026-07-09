# Marketing & Launch Plan

## Positioning

**Fluid** is an open-source documentation platform that generates docs from code,
publishes to the web, and keeps teams in sync — no build steps, no separate
hosting, no configuration.

### One-liners

- "Documentation that writes itself."
- "Open-source docs platform for engineering teams."
- "Import your OpenAPI specs or TypeScript types. Get beautiful docs. Ship."

### Target audience

- Engineering teams at startups (5–50 people)
- API-first companies that need developer docs
- OSS maintainers who want a docs site without managing a static site generator
- Teams migrating from GitBook, Notion, Confluence, or Docusaurus

## Pre-Launch Checklist

- [ ] Deploy to production (see DEPLOY.md)
- [ ] Set up PostgreSQL (Railway or Render)
- [ ] Point `usedocs.com` or your domain to production
- [ ] Set `APP_URL` in production env
- [ ] Set up GitHub OAuth (creates trust — users see "Sign in with GitHub")
- [ ] Add Google OAuth (optional but recommended)
- [ ] Create a free project with real sample docs (dogfooding)
- [ ] Write Terms of Service and Privacy Policy pages (update with your info)
- [ ] Add Stripe keys when ready to accept payments (for Pro plan)

## Launch Channels

### 1. Hacker News (highest ROI for developer tools)

**Strategy:** "Show HN" post with a demo video and honest "built in the open"
vibe. Developers respond to open-source, well-designed tools.

**Title idea:** "Show HN: Fluid – Open-source docs platform with auto-import
from OpenAPI and TypeScript"

**Key points:**
- It's open source (MIT)
- Import OpenAPI or TypeScript → get docs
- No build step, no separate hosting
- Cmd+K search, graph view, wiki links
- Free tier with public hosting

### 2. Product Hunt

**Strategy:** Launch on a Tuesday/Wednesday morning (US time). Have a team
member or friend scheduled to upvote early. Prepare a landing page with GIF
demos.

### 3. X / Twitter

- Post build-in-public threads showing the product evolution
- Short demo videos (20 seconds each): graph view, OpenAPI import, search
- Tag developer communities: @Vercel, @NextJS, @Prisma, @TailwindCSS
- Use hashtags: #buildinpublic #opensource #documentation #devtools

### 4. Reddit

- r/programming, r/webdev, r/opensource, r/SideProject
- Don't hard-sell. Post a demo GIF with "I built an open-source docs platform"
- Be ready to answer technical questions in comments

### 5. GitHub

- Add topics to the repo: `documentation`, `docs`, `nextjs`, `openapi`,
  `developer-tools`, `knowledge-base`
- Keep the README polished (done)
- Respond to issues within 24 hours
- Consider a `hacktoberfest` label in October

### 6. Direct outreach

- Find teams using GitBook, ReadMe, or Docusaurus
- Reach out with a personal message: "We built an alternative. Here's why teams
  are switching..."
- Offer help with migration (import/export makes this easy)

## Content Strategy

### Blog posts to write

1. "Why we built an open-source docs platform"
2. "From OpenAPI spec to docs site in 30 seconds"
3. "The docs stack we replaced with one tool"
4. "How we designed the graph view for documentation"
5. "Migrating from GitBook to Fluid: a step-by-step guide"

### SEO keywords to target

- "open source documentation platform"
- "docs as code platform"
- "api documentation generator open source"
- "markdown documentation site"
- "developer documentation tool"

## Metrics to Track

| Metric                | Target        |
|-----------------------|---------------|
| GitHub stars          | 100 (week 1)  |
| Signups               | 50 (week 1)   |
| Pages created         | 200 (week 1)  |
| Published projects    | 10 (week 1)   |
| Active weekly users   | 25% of signed up |

## Post-Launch

- Gather feedback from first users — what's broken, what's missing
- Ship quick wins from feedback publicly (builds trust)
- Publish a changelog / "this week in Fluid"
- Consider a "Docs as Code" webinar or Twitter Space with early users
- Apply to OSS funding programs (GitHub Sponsors, Open Collective, etc.)
