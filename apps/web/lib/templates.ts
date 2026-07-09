export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
}

export const templates: PageTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Page',
    description: 'Start from scratch',
    content: '',
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
  },
];
