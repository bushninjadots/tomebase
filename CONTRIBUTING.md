# Contributing to TomeBase

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/bushninjadots/tomebase.git
cd tomebase
npm install
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your DATABASE_URL and AUTH_SECRET
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create an account.

## Branch Naming

| Prefix | Purpose |
|--------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation changes |
| `refactor/` | Code restructuring |
| `test/` | Adding or updating tests |
| `chore/` | Maintenance tasks |

Examples: `feat/add-java-parser`, `fix/slug-collision`, `docs/update-readme`

## Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add C++ code parser
fix: resolve slug collision loop in page creation
docs: update README with architecture diagram
refactor: extract rate limiting into shared middleware
test: add unit tests for health engine
chore: update dependencies
```

## Pull Requests

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Run the checks:
   ```bash
   npm run typecheck
   npm run lint
   npm run test
   ```
5. Open a PR with a clear description of what changed and why

### PR Guidelines

- Keep PRs focused — one feature or fix per PR
- Include screenshots for UI changes
- Add tests for new utility functions and API routes
- Update documentation if adding user-facing features
- Reference related issues (e.g., "Closes #42")

## Coding Standards

- **TypeScript strict mode** throughout
- **Server components by default** — client components only for interactivity
- **Tailwind CSS** — use theme CSS variables (`text-theme-*`, `bg-theme-*`) not hardcoded colors
- **No comments** unless explaining non-obvious business logic
- **Follow existing patterns** — look at neighboring files before adding new ones

## Issue Templates

### Bug Report

- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/OS info

### Feature Request

- Problem description
- Proposed solution
- Alternatives considered

## Project Structure

```
tomebase/
├── apps/web/          # Next.js 15 App Router
├── packages/ui/       # Shared UI components
├── packages/utils/    # Helper functions
├── packages/database/ # Prisma schema + client
├── packages/types/    # Shared TypeScript types
├── packages/codegen/  # Code parsers (9 languages)
└── packages/config/   # Shared ESLint + TS config
```

## Questions?

Open a [Discussion](https://github.com/bushninjadots/tomebase/discussions) on GitHub.
