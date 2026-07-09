# ADR-0001: Next.js + TypeScript

## Status
Accepted

## Context
TomeBase needs a modern web framework with:
- Server-side rendering for SEO and performance
- API routes for backend functionality
- Type safety for maintainability
- Large ecosystem and community support

## Decision
Use Next.js 15 with App Router and TypeScript throughout the stack.

## Consequences
- Server components reduce client-side JavaScript
- API routes colocate backend with frontend
- TypeScript strict mode catches errors at compile time
- Large ecosystem of libraries and tools available

## Related
- ADR-0002 (future): Database selection (Prisma)
- ADR-0003 (future): Authentication strategy (NextAuth)
