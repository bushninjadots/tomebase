import type { PageTemplate, ProjectTemplate } from './types';

export const pageTemplates: PageTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Page',
    description: 'Start from scratch',
    content: '',
    category: 'getting-started',
    icon: 'FileText',
    placeholders: [],
    tags: ['empty', 'scratch'],
  },
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Quick start guide for users',
    content: `# Getting Started with {{title}}

## Installation

\`\`\`bash
npm install your-package
\`\`\`

## Quick Start

\`\`\`typescript
import { something } from 'your-package';

const result = something({
  option: 'value',
});
console.log(result);
\`\`\`

## Next Steps

- [[Configuration]] — customize to your needs
- [[API Reference]] — explore the full API
`,
    category: 'getting-started',
    icon: 'Rocket',
    placeholders: ['title'],
    tags: ['setup', 'install', 'quickstart', 'intro'],
  },
  {
    id: 'api-reference',
    name: 'API Reference',
    description: 'Document endpoints and methods',
    content: `# {{title}}

## Overview

Brief description of this API endpoint or module.

## Endpoint

\`\`\`
GET /api/v1/resource
\`\`\`

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| \`id\` | \`string\` | Yes | Unique identifier |
| \`limit\` | \`number\` | No | Results per page (default: 20) |

## Request Example

\`\`\`bash
curl -X GET https://api.example.com/v1/resource \\
  -H "Authorization: Bearer YOUR_API_KEY"
\`\`\`

## Response

\`\`\`json
{
  "id": "abc-123",
  "name": "Example",
  "createdAt": "2024-01-01T00:00:00Z"
}
\`\`\`

## Error Codes

| Code | Description |
|------|-------------|
| \`400\` | Bad request — invalid parameters |
| \`401\` | Unauthorized — missing or invalid API key |
| \`404\` | Not found — resource does not exist |
`,
    category: 'api',
    icon: 'Code2',
    placeholders: ['title'],
    tags: ['endpoints', 'rest', 'http', 'methods'],
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting Guide',
    description: 'Common issues and solutions',
    content: `# {{title}}

## Common Issues

### Issue: Connection refused

**Cause**: The service is not running or the port is blocked.

**Solution**:
1. Check that the service is running: \`systemctl status your-service\`
2. Verify the port is open: \`netstat -tlnp | grep :8080\`
3. Restart the service: \`systemctl restart your-service\`

### Issue: Authentication failed

**Cause**: Invalid or expired credentials.

**Solution**:
1. Regenerate your API key in the dashboard
2. Update your environment variables
3. Verify the key has the correct permissions

## Getting Help

If you continue to experience issues, reach out to our support team with:
- Steps to reproduce
- Relevant error logs
- Your environment details
`,
    category: 'operations',
    icon: 'AlertTriangle',
    placeholders: ['title'],
    tags: ['issues', 'errors', 'debug', 'fix', 'help'],
  },
  {
    id: 'release-notes',
    name: 'Release Notes',
    description: 'Changelog for a new version',
    content: `# {{title}}

**Release date**: {{date}}

## Features

- New feature or major addition

## Improvements

- Performance optimization or UX enhancement

## Bug Fixes

- Bug fix or regression fix

## Breaking Changes

- Changes that require migration or updates

## Deprecations

- Features that are deprecated and will be removed in a future version
`,
    category: 'process',
    icon: 'Tag',
    placeholders: ['title', 'date'],
    tags: ['changelog', 'version', 'release', 'shipping'],
  },
  {
    id: 'architecture',
    name: 'Architecture Overview',
    description: 'System architecture and design decisions',
    content: `# {{title}}

## Overview

The system follows a modular monolith architecture with clear separation of concerns across three primary layers: the presentation layer (Next.js frontend), the application layer (API routes and server actions), and the data layer (Prisma ORM with SQLite/PostgreSQL). This structure keeps concerns isolated while allowing each layer to evolve independently.

## Key Design Decisions

- **Monorepo with Turborepo**: All packages live under a single repository, sharing TypeScript types, UI components, and utility libraries without the overhead of managing multiple repos.
- **Server-First Rendering**: Pages default to React Server Components, minimizing client-side JavaScript and improving initial load performance.
- **AI-Native Architecture**: The AI SDK is integrated at the application layer, allowing AI features to access the same data layer as traditional UI components.

## Related Pages

- [[Getting Started]] — set up your local development environment
- [[API Reference]] — explore available endpoints
- [[Configuration]] — environment and project configuration
- [[Authentication]] — auth flow and security
- [[Database]] — schema and migrations
`,
    category: 'reference',
    icon: 'Layers',
    placeholders: ['title'],
    tags: ['system', 'design', 'structure', 'overview'],
  },
  {
    id: 'configuration',
    name: 'Configuration',
    description: 'Environment and project configuration',
    content: `# {{title}}

## Environment Variables

Configuration is managed through environment variables defined in \`.env\` files at the project root. Required variables include database connection strings, auth provider credentials, and API keys for external services. A \`.env.example\` file is provided as a reference.

## Application Settings

Runtime configuration lives in \`packages/config/\`, which exports typed configuration objects consumed by both the web app and shared packages. This centralised approach ensures consistent values across the monorepo and makes it easy to validate configuration at startup.

## Related Pages

- [[API Reference]] — endpoint configuration details
- [[Architecture Overview]] — how configuration fits into the system
- [[Getting Started]] — quick start guide
- [[Database]] — database connection configuration
`,
    category: 'reference',
    icon: 'Settings',
    placeholders: ['title'],
    tags: ['env', 'settings', 'config', 'environment'],
  },
  {
    id: 'database',
    name: 'Database',
    description: 'Database schema and migrations',
    content: `# {{title}}

## Schema

The database schema is defined in \`packages/database/prisma/schema.prisma\` using Prisma's schema language. It includes models for users, documents, workspaces, and audit logs. Relationships are enforced at the database level through foreign key constraints.

## Migrations

Schema changes are managed through Prisma Migrations. After editing the schema file, run \`npm run db:generate\` to regenerate the Prisma client and \`npm run db:push\` to apply changes to the local SQLite database. Production migrations use the \`prisma migrate deploy\` command.

## Related Pages

- [[Configuration]] — database connection settings
- [[API Reference]] — data access patterns
- [[Architecture Overview]] — data layer design
`,
    category: 'reference',
    icon: 'Database',
    placeholders: ['title'],
    tags: ['schema', 'migrations', 'orm', 'prisma', 'sql'],
  },
  {
    id: 'authentication',
    name: 'Authentication',
    description: 'Auth flow and security',
    content: `# {{title}}

## Auth Providers

Authentication is handled by NextAuth v5 with support for GitHub and Google OAuth providers. Users can sign in using their existing accounts from these providers, eliminating the need for separate credentials. Additional providers can be added through the NextAuth configuration in \`apps/web/lib/auth.ts\`.

## Session Management

Sessions are managed via JWT tokens stored in HTTP-only cookies. The session is verified on every request through middleware at the application layer, and the current user context is available to server components and server actions without additional database lookups.

## Related Pages

- [[API Reference]] — authenticated endpoint requirements
- [[Configuration]] — OAuth credentials and environment setup
- [[Architecture Overview]] — security architecture
`,
    category: 'reference',
    icon: 'Shield',
    placeholders: ['title'],
    tags: ['auth', 'security', 'oauth', 'sessions', 'jwt'],
  },
  {
    id: 'changelog',
    name: 'Changelog',
    description: 'Track changes across versions',
    content: `# {{title}}

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- New feature or capability

### Changed
- Changes to existing functionality

### Deprecated
- Features that will be removed

### Removed
- Features that have been removed

### Fixed
- Bug fixes

### Security
- Vulnerability fixes

---

## [1.0.0] — {{date}}

### Added
- Initial release
`,
    category: 'process',
    icon: 'ScrollText',
    placeholders: ['title', 'date'],
    tags: ['changes', 'versions', 'history', 'log'],
  },
  {
    id: 'runbook',
    name: 'Runbook',
    description: 'Operational procedures and incident response',
    content: `# {{title}}

## Overview

This runbook covers operational procedures for {{title}}.

## Prerequisites

- Access to the production environment
- Required tools: \`kubectl\`, \`helm\`, \`aws-cli\`
- On-call rotation access

## Common Operations

### Restart the service

\`\`\`bash
kubectl rollout restart deployment/{{title}} -n production
\`\`\`

### Check health

\`\`\`bash
curl -f https://api.example.com/health
\`\`\`

### View logs

\`\`\`bash
kubectl logs -f deployment/{{title}} -n production --tail=100
\`\`\`

## Incident Response

### Severity 1: Service Down

1. Check the health endpoint
2. Review recent deployments
3. Check resource utilization
4. Escalate if not resolved in 15 minutes

### Severity 2: Degraded Performance

1. Check error rates in monitoring
2. Review database query performance
3. Check for resource bottlenecks

## Contacts

- **On-call**: Check PagerDuty rotation
- **Slack**: #ops channel
`,
    category: 'operations',
    icon: 'ClipboardList',
    placeholders: ['title'],
    tags: ['ops', 'incident', ' procedures', 'oncall'],
  },
  {
    id: 'rfc',
    name: 'RFC / Design Doc',
    description: 'Request for Comments or design proposal',
    content: `# {{title}}

**Status**: Draft
**Author**: <!-- your name -->
**Date**: {{date}}

## Summary

One paragraph explanation of the proposal.

## Motivation

Why are we doing this? What problem does it solve?

## Detailed Design

How does this work? Include:
- API changes
- Data model changes
- UI/UX changes
- Security considerations

## Alternatives Considered

What other approaches did we consider? Why were they rejected?

## Migration Plan

How do we transition from the current state to the new state?

## Rollout Plan

1. Feature flag: \`ENABLE_{{title}}\`
2. Gradual rollout: 10% → 50% → 100%
3. Rollback: disable feature flag

## References

- [[Architecture Overview]]
- [[API Reference]]
`,
    category: 'planning',
    icon: 'FileCheck',
    placeholders: ['title', 'date'],
    tags: ['design', 'proposal', 'rfc', 'adr', 'decision'],
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Structured meeting notes template',
    content: `# {{title}}

**Date**: {{date}}
**Attendees**: <!-- list names -->
**Duration**: <!-- minutes -->

## Agenda

1. Topic 1
2. Topic 2
3. Topic 3

## Discussion Notes

### Topic 1

Notes here...

### Topic 2

Notes here...

## Decisions Made

- [ ] Decision 1 — @owner
- [ ] Decision 2 — @owner

## Action Items

- [ ] Action item 1 — @owner — due {{date}}
- [ ] Action item 2 — @owner — due {{date}}

## Next Meeting

- Date: <!-- next meeting date -->
- Agenda items: <!-- topics to discuss -->
`,
    category: 'process',
    icon: 'Calendar',
    placeholders: ['title', 'date'],
    tags: ['meeting', 'notes', 'minutes', 'agenda'],
  },
  {
    id: 'tutorial',
    name: 'Tutorial',
    description: 'Step-by-step learning guide',
    content: `# {{title}}

> **Difficulty**: Beginner | **Time**: 30 minutes

## What You'll Learn

- Learning objective 1
- Learning objective 2
- Learning objective 3

## Prerequisites

Before starting, make sure you have:
- Node.js 18+ installed
- A text editor (VS Code recommended)
- Basic knowledge of JavaScript

## Step 1: Setup

First, create a new project:

\`\`\`bash
npx create-app my-tutorial
cd my-tutorial
\`\`\`

## Step 2: Create Your First Page

Open \`src/index.ts\` and add:

\`\`\`typescript
import { createPage } from 'your-package';

const page = createPage({
  title: 'Hello World',
  content: 'Welcome to the tutorial!',
});
\`\`\`

## Step 3: Run It

\`\`\`bash
npm start
\`\`\`

Visit \`http://localhost:3000\` to see your page.

## Congratulations!

You've completed the tutorial. Next steps:

- [[Getting Started]] — dive deeper
- [[API Reference]] — explore the full API
`,
    category: 'getting-started',
    icon: 'GraduationCap',
    placeholders: ['title'],
    tags: ['learning', 'guide', 'walkthrough', 'lesson'],
  },
  {
    id: 'postmortem',
    name: 'Postmortem',
    description: 'Incident postmortem template',
    content: `# {{title}}

**Incident Date**: {{date}}
**Duration**: <!-- hours/minutes -->
**Severity**: <!-- P1/P2/P3 -->
**Author**: <!-- your name -->

## Summary

One paragraph describing the incident and its impact.

## Timeline (UTC)

| Time | Event |
|------|-------|
| HH:MM | Alert fired |
| HH:MM | Investigation started |
| HH:MM | Root cause identified |
| HH:MM | Fix deployed |
| HH:MM | Service fully recovered |

## Root Cause

What caused the incident?

## Impact

- **Users affected**: <!-- number -->
- **Duration**: <!-- time -->
- **Revenue impact**: <!-- if applicable -->

## What Went Well

- Things that helped during the incident

## What Went Wrong

- Things that made the incident worse or harder to resolve

## Action Items

- [ ] Action 1 — @owner — priority: high
- [ ] Action 2 — @owner — priority: medium
- [ ] Action 3 — @owner — priority: low

## Lessons Learned

Key takeaways for the team.
`,
    category: 'operations',
    icon: 'FileWarning',
    placeholders: ['title', 'date'],
    tags: ['incident', 'blameless', 'review', 'retrospective'],
  },
  {
    id: 'sdk-reference',
    name: 'SDK Reference',
    description: 'Library/SDK documentation',
    content: `# {{title}}

## Installation

\`\`\`bash
npm install {{title}}
\`\`\`

## Quick Start

\`\`\`typescript
import { Client } from '{{title}}';

const client = new Client({
  apiKey: process.env.API_KEY,
});

const result = await client.doSomething({
  option: 'value',
});
\`\`\`

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`apiKey\` | \`string\` | required | Your API key |
| \`baseUrl\` | \`string\` | \`'https://api.example.com'\` | API base URL |
| \`timeout\` | \`number\` | \`30000\` | Request timeout in ms |

## Methods

### \`client.doSomething(params)\`

Performs an action.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| \`option\` | \`string\` | Yes | The option to use |

**Returns:** \`Promise<Result>\`

**Example:**

\`\`\`typescript
const result = await client.doSomething({ option: 'value' });
console.log(result.id);
\`\`\`

## Error Handling

\`\`\`typescript
import { Client, APIError } from '{{title}}';

try {
  await client.doSomething({ option: 'value' });
} catch (error) {
  if (error instanceof APIError) {
    console.error(error.status, error.message);
  }
}
\`\`\`

## Related Pages

- [[API Reference]] — REST API docs
- [[Configuration]] — environment setup
`,
    category: 'api',
    icon: 'Package',
    placeholders: ['title'],
    tags: ['sdk', 'library', 'client', 'package'],
  },
  {
    id: 'glossary',
    name: 'Glossary',
    description: 'Term definitions and terminology',
    content: `# {{title}}

| Term | Definition |
|------|------------|
| **Term 1** | Definition of term 1 |
| **Term 2** | Definition of term 2 |
| **Term 3** | Definition of term 3 |
| **Term 4** | Definition of term 4 |
| **Term 5** | Definition of term 5 |

## Abbreviations

| Abbreviation | Full Form |
|--------------|-----------|
| **API** | Application Programming Interface |
| **REST** | Representational State Transfer |
| **SDK** | Software Development Kit |
| **URL** | Uniform Resource Locator |

## See Also

- [[Getting Started]] — common terms in context
- [[Configuration]] — configuration-specific terms
`,
    category: 'reference',
    icon: 'BookOpen',
    placeholders: ['title'],
    tags: ['terms', 'definitions', 'vocabulary', 'acronyms'],
  },
];

export const projectTemplates: ProjectTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start from scratch with no pages',
    icon: 'FileText',
    category: 'getting-started',
    pages: [],
  },
  {
    id: 'api-docs',
    name: 'API Documentation',
    description: 'Getting Started + API Reference pages',
    icon: 'Code2',
    category: 'api',
    pages: [
      { title: 'Getting Started', templateId: 'getting-started', description: 'Quick start guide' },
      { title: 'API Reference', templateId: 'api-reference', description: 'Available endpoints and methods' },
    ],
  },
  {
    id: 'internal-wiki',
    name: 'Internal Wiki',
    description: 'Home page + Getting Started for team knowledge base',
    icon: 'Users',
    category: 'getting-started',
    pages: [
      { title: 'Home', templateId: 'blank', description: 'Welcome to the team wiki' },
      { title: 'Getting Started', templateId: 'getting-started', description: 'How to contribute' },
    ],
  },
  {
    id: 'product-docs',
    name: 'Product Documentation',
    description: 'Overview, Getting Started, and Troubleshooting',
    icon: 'BookOpen',
    category: 'getting-started',
    pages: [
      { title: 'Overview', templateId: 'blank', description: 'Product overview' },
      { title: 'Getting Started', templateId: 'getting-started', description: 'Quick start guide' },
      { title: 'Troubleshooting', templateId: 'troubleshooting', description: 'Common issues and solutions' },
    ],
  },
  {
    id: 'runbook-project',
    name: 'Runbook Collection',
    description: 'Incident response, deployment, and rollback procedures',
    icon: 'ClipboardList',
    category: 'operations',
    pages: [
      { title: 'Incident Response', templateId: 'runbook', description: 'How to handle incidents' },
      { title: 'Deployment', templateId: 'runbook', description: 'Deployment procedures' },
      { title: 'Rollback', templateId: 'runbook', description: 'Rollback procedures' },
    ],
  },
];
